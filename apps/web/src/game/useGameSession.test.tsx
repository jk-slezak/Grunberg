// @vitest-environment jsdom
import type { ReactNode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyAction,
  applyIntents,
  createInitialGameState,
  type GameState,
  type Intent,
  type MapTile,
} from "@grunberg/engine";
import type { GameView } from "../api/client";
import { loadSession, saveSession } from "../services/session";
import { SEND_INTERVAL_MS, STEP_INTERVAL_MS, useGameSession } from "./useGameSession";

const NOW = 1_700_000_000_000;
const GAME_ID = "11111111-1111-4111-8111-111111111111";
const RESTORED_ID = "22222222-2222-4222-8222-222222222222";

const corridor = (): GameState => {
  const hero = applyAction(
    createInitialGameState(NOW),
    {
      type: "CREATE_CHARACTER",
      payload: {
        name: "Aria",
        race: "Elf",
        gender: false,
        class: "Mage",
        stats: { strength: 3, agility: 5, intelligence: 7 },
      },
    },
    { now: NOW },
  ).state;
  const tiles = [0, 1, 2].map((y) =>
    [0, 1, 2, 3, 4].map((x): MapTile => ({
      x,
      y,
      type: y === 1 ? "empty" : "wall",
      explored: true,
      visible: true,
    })),
  );
  return {
    ...hero,
    currentFloor: { floorNumber: 1, seed: "test", enemies: [], npcs: [], tiles },
    position: { floor: 1, x: 0, y: 1 },
  };
};

const respond = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

const createServer = () => {
  let game: GameView = { id: GAME_ID, version: 0, state: corridor(), snapshot: "snapshot-0" };
  const requests: { path: string; body?: { expectedVersion: number; intents: Intent[] } }[] = [];

  const handle = async (path: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ path, body });
    if (path.endsWith("/actions")) {
      if (body.expectedVersion !== game.version) return respond(409, { current: game });
      const result = applyIntents(game.state, body.intents, { now: NOW });
      if (result.rejected?.index === 0) return respond(422, { reason: result.rejected.reason });
      const version = game.version + 1;
      game = { ...game, version, state: result.state, snapshot: `snapshot-${version}` };
      return respond(200, { ...game, events: result.events, rejected: result.rejected });
    }
    if (path.endsWith("/restore")) {
      game = { ...game, id: RESTORED_ID, version: 0 };
      return respond(201, game);
    }
    return respond(200, game);
  };

  return {
    requests,
    actions: () => requests.filter((r) => r.path.endsWith("/actions")),
    get game() {
      return game;
    },
    moveElsewhere: () => {
      const result = applyIntents(game.state, [{ type: "move", direction: "east" }], { now: NOW });
      game = { ...game, version: game.version + 1, state: result.state };
    },
    handle,
  };
};

let server: ReturnType<typeof createServer>;
const fetchMock = vi.fn((path: string, init?: RequestInit) => server.handle(path, init));

const east: Intent = { type: "move", direction: "east" };
const north: Intent = { type: "move", direction: "north" };

const renderSession = async () => {
  const client = new QueryClient();
  const onMessages = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useGameSession(onMessages), { wrapper });
  await settle(0);
  return { ...hook, onMessages, texts: () => onMessages.mock.calls.flat(2).map((m) => m.text) };
};

const settle = (ms = SEND_INTERVAL_MS) => act(() => vi.advanceTimersByTimeAsync(ms));

const step = (push: (intent: Intent) => void, intent: Intent) => {
  vi.setSystemTime(Date.now() + STEP_INTERVAL_MS);
  act(() => push(intent));
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  server = createServer();
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
  saveSession(server.game, NOW);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("useGameSession", () => {
  it("loads the saved game", async () => {
    const { result } = await renderSession();
    expect(result.current.status).toBe("ready");
    expect(result.current.state?.position).toMatchObject({ x: 0, y: 1 });
  });

  it("shows a move at once and confirms it with the server in the background", async () => {
    const { result } = await renderSession();

    step(result.current.push, east);
    step(result.current.push, east);

    expect(result.current.state?.position).toMatchObject({ x: 2 });
    expect(server.actions()).toHaveLength(0);

    await settle();

    expect(server.actions()).toEqual([
      {
        path: `/api/games/${GAME_ID}/actions`,
        body: { expectedVersion: 0, intents: [east, east] },
      },
    ]);
    expect(result.current.state?.position).toMatchObject({ x: 2 });
    expect(loadSession()?.snapshot).toBe("snapshot-1");
  });

  it("keeps moving while a request is in flight and sends the rest in the next batch", async () => {
    const { result } = await renderSession();

    step(result.current.push, east);
    await settle(0);
    step(result.current.push, east);
    step(result.current.push, east);
    expect(result.current.state?.position).toMatchObject({ x: 3 });

    await settle();

    expect(server.actions().map((r) => r.body)).toEqual([
      { expectedVersion: 0, intents: [east] },
      { expectedVersion: 1, intents: [east, east] },
    ]);
    expect(result.current.state?.position).toMatchObject({ x: 3 });
  });

  it("waits for the request in flight, showing its moves until the server answers", async () => {
    const { result } = await renderSession();
    let release = () => {};
    fetchMock.mockImplementationOnce(
      (path, init) =>
        new Promise((resolve) => {
          release = () => resolve(server.handle(path, init));
        }),
    );

    step(result.current.push, east);
    await settle(0);
    step(result.current.push, east);
    await settle(SEND_INTERVAL_MS * 3);

    expect(server.requests.filter((r) => r.path.endsWith("/actions"))).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.state?.position).toMatchObject({ x: 2 });

    release();
    await settle();

    expect(server.actions().map((r) => r.body)).toEqual([
      { expectedVersion: 0, intents: [east] },
      { expectedVersion: 1, intents: [east] },
    ]);
    expect(result.current.state?.position).toMatchObject({ x: 2 });
  });

  it("refuses a move into a wall without asking the server", async () => {
    const { result, texts } = await renderSession();

    step(result.current.push, north);
    await settle();

    expect(server.actions()).toHaveLength(0);
    expect(result.current.state?.position).toMatchObject({ x: 0 });
    expect(texts()).toContain("Ściana. Tędy nie przejdziesz.");
  });

  it("ignores key repeat faster than walking pace", async () => {
    const { result } = await renderSession();
    act(() => {
      result.current.push(east);
      result.current.push(east);
    });
    expect(result.current.state?.position).toMatchObject({ x: 1 });
  });

  it("rolls the move back when the server can't be reached", async () => {
    const { result, texts } = await renderSession();
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    step(result.current.push, east);
    await settle();

    expect(result.current.state?.position).toMatchObject({ x: 0 });
    expect(texts()).toContain("Brak połączenia z serwerem. Ruch cofnięty.");
  });

  it("takes the server's state when another tab changed the game (409)", async () => {
    const { result, texts } = await renderSession();
    server.moveElsewhere();

    step(result.current.push, east);
    await settle();

    expect(result.current.state?.position).toMatchObject({ x: 1 });
    expect(texts()).toContain("Gra zmieniła się w innej karcie. Wczytano aktualny stan.");

    step(result.current.push, east);
    await settle();
    expect(server.actions().at(-1)?.body?.expectedVersion).toBe(1);
    expect(result.current.state?.position).toMatchObject({ x: 2 });
  });

  it("restores the game from the snapshot when the server copy has expired", async () => {
    fetchMock.mockImplementationOnce(async () => respond(404, { error: "Game not found" }));

    const { result } = await renderSession();

    expect(result.current.status).toBe("ready");
    expect(server.requests.at(-1)?.path).toBe("/api/games/restore");
    expect(loadSession()?.gameId).toBe(RESTORED_ID);
  });

  it("forgets a save the server refuses to restore and reports it missing", async () => {
    fetchMock
      .mockImplementationOnce(async () => respond(404, { error: "Game not found" }))
      .mockImplementationOnce(async () => respond(400, { error: "Invalid or tampered save" }));

    const { result } = await renderSession();

    expect(result.current.status).toBe("missing");
    expect(loadSession()).toBeNull();
  });

  it("reports a missing save so the screen can go back to the menu", async () => {
    localStorage.clear();
    const { result } = await renderSession();
    expect(result.current.status).toBe("missing");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
