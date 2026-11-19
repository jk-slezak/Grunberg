import { beforeEach, describe, expect, it } from "vitest";
import { MAX_BODY_BYTES } from "@/server/request";
import { RULES } from "@/server/rateLimit";
import { POST as createGame } from "./route";
import { GET as getGame } from "./[id]/route";
import { GET as getEvents } from "./[id]/events/route";
import { POST as act } from "./[id]/actions/route";

const character = {
  name: "Aria",
  race: "Elf",
  gender: false,
  class: "Mage",
  stats: { strength: 3, agility: 5, intelligence: 7 },
};

const ORIGIN = "http://grunberg.test";
const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

const request = (path: string, init: RequestInit = {}) => new Request(`${ORIGIN}${path}`, init);

const post = (body: unknown, headers: Record<string, string> = {}) =>
  request("/api/games", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

const newGame = async () =>
  (await (await createGame(post({ character }))).json()) as { id: string };

describe("/api/games routes", () => {
  beforeEach(() => {
    delete (globalThis as { grunbergStore?: unknown }).grunbergStore;
  });

  it("201 on create, then 200 with the game", async () => {
    const res = await createGame(post({ character }));
    expect(res.status).toBe(201);
    const { id } = await res.json();

    const game = await getGame(request(`/api/games/${id}`), ctx(id));
    expect(game.status).toBe(200);
    expect(await game.json()).toMatchObject({ version: 0, state: { character: { name: "Aria" } } });
  });

  describe("400: invalid input", () => {
    it.each([
      [
        "stats that don't add up to 15",
        { ...character, stats: { strength: 10, agility: 10, intelligence: 10 } },
      ],
      ["a name over 20 characters", { ...character, name: "A".repeat(21) }],
      ["control characters in the name", { ...character, name: "Ari\u0000a" }],
      ["bidi override characters in the name", { ...character, name: "Ari\u202Ea" }],
      ["an unknown race", { ...character, race: "Orc" }],
    ])("rejects %s", async (_, invalid) => {
      expect((await createGame(post({ character: invalid }))).status).toBe(400);
    });

    it("rejects invalid JSON and a malformed id", async () => {
      expect((await createGame(post("{"))).status).toBe(400);
      expect((await getGame(request("/api/games/x"), ctx("not-a-uuid"))).status).toBe(400);
    });

    it("rejects a raw state change instead of an intent", async () => {
      const { id } = await newGame();
      const res = await act(
        request(`/api/games/${id}/actions`, {
          method: "POST",
          body: JSON.stringify({ expectedVersion: 0, intent: { type: "ADD_ITEM" } }),
          headers: { "content-type": "application/json" },
        }),
        ctx(id),
      );
      expect(res.status).toBe(400);
    });

    it("normalizes a valid name (trim + NFC)", async () => {
      const res = await createGame(
        post({ character: { ...character, name: "  Zoe\u0308 O'Neil " } }),
      );
      expect(res.status).toBe(201);
      expect((await res.json()).state.character.name).toBe("Zo\u00EB O'Neil");
    });
  });

  it("403 for a cross-origin browser request", async () => {
    expect((await createGame(post({ character }, { origin: "https://evil.example" }))).status).toBe(
      403,
    );
    expect((await createGame(post({ character }, { origin: ORIGIN }))).status).toBe(201);
  });

  it("413 for a body over the size limit, even without Content-Length", async () => {
    const huge = JSON.stringify({ character, padding: "x".repeat(MAX_BODY_BYTES) });
    expect((await createGame(post(huge))).status).toBe(413);
  });

  it("415 without a JSON Content-Type (blocks simple cross-site form/text posts)", async () => {
    const res = await createGame(
      request("/api/games", {
        method: "POST",
        body: JSON.stringify({ character }),
        headers: { "content-type": "text/plain" },
      }),
    );
    expect(res.status).toBe(415);
  });

  it("404 for an unknown game", async () => {
    expect((await getGame(request("/"), ctx(UNKNOWN_ID))).status).toBe(404);
    expect((await getEvents(request("/"), ctx(UNKNOWN_ID))).status).toBe(404);
  });

  it("409 with the current game on a stale version", async () => {
    const { id } = await newGame();
    const res = await act(
      request(`/api/games/${id}/actions`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: 5, intent: { type: "move", direction: "east" } }),
        headers: { "content-type": "application/json" },
      }),
      ctx(id),
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ current: { id, version: 0 } });
  });

  it("422 when the intent breaks the rules", async () => {
    const { id } = await newGame();
    const res = await act(
      request(`/api/games/${id}/actions`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: 0, intent: { type: "move", direction: "east" } }),
        headers: { "content-type": "application/json" },
      }),
      ctx(id),
    );
    expect(res.status).toBe(422);
  });

  it("429 with Retry-After once the global game-creation limit is used up", async () => {
    for (let i = 0; i < RULES.createGame.limit; i++) {
      expect((await createGame(post({ character }))).status).toBe(201);
    }
    const limited = await createGame(post({ character }));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("malformed requests do not use up the global creation limit", async () => {
    for (let i = 0; i < RULES.createGame.limit; i++) {
      expect((await createGame(post({}))).status).toBe(400);
    }
    expect((await createGame(post({ character }))).status).toBe(201);
  });

  it("reads are not rate limited by the app (Vercel Firewall limits per IP)", async () => {
    const { id } = await newGame();
    for (let i = 0; i < 50; i++) expect((await getGame(request("/"), ctx(id))).status).toBe(200);
  });
});
