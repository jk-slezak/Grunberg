import { beforeEach, describe, expect, it } from "vitest";
import type { DungeonFloor, MapTile } from "@grunberg/engine";
import { buildApp } from "../src/app";
import { InMemoryGameRepository } from "../src/repository";

const character = {
  name: "Aria",
  race: "Elf",
  gender: false,
  class: "Mage",
  stats: { strength: 3, agility: 7, intelligence: 7 },
};

/**
 * 3×3 floor: walls on the edges, except one opening at (0,1) leading off the map.
 *   # # #
 *   . . #
 *   # # #
 */
const floor: DungeonFloor = {
  floorNumber: 0,
  seed: "test",
  enemies: [],
  npcs: [],
  tiles: [0, 1, 2].map((y) =>
    [0, 1, 2].map((x): MapTile => {
      const open = y === 1 && x < 2;
      return { x, y, type: open ? "empty" : "wall", explored: false, visible: false };
    }),
  ),
};

describe("game API", () => {
  let repo: InMemoryGameRepository;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    repo = new InMemoryGameRepository();
    app = buildApp(repo, () => 1_700_000_000_000);
  });

  const createGame = async () => {
    const res = await app.inject({ method: "POST", url: "/games", payload: { character } });
    expect(res.statusCode).toBe(201);
    return res.json() as { id: string; version: number };
  };

  /** Puts the player on the test floor at (x, 1). Bumps the version to 1. */
  const seedFloor = async (id: string, x: number) => {
    const game = (await repo.get(id))!;
    await repo.save(
      id,
      game.version,
      { ...game.state, currentFloor: floor, position: { floor: 0, x, y: 1 } },
      [],
    );
  };

  const move = (id: string, expectedVersion: number, direction: string) =>
    app.inject({
      method: "POST",
      url: `/games/${id}/actions`,
      payload: { expectedVersion, intent: { type: "move", direction } },
    });

  it("creates a game and returns it with the character status", async () => {
    const { id } = await createGame();
    const res = await app.inject({ method: "GET", url: `/games/${id}` });
    expect(res.json()).toMatchObject({ version: 0, state: { character: { name: "Aria" } } });
  });

  it("rejects an invalid character", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/games",
      payload: { character: { ...character, stats: { strength: 99, agility: 1, intelligence: 1 } } },
    });
    expect(res.statusCode).toBe(400);
  });

  it("applies a move and bumps the version", async () => {
    const { id } = await createGame();
    await seedFloor(id, 0);

    const res = await move(id, 1, "east");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ version: 2, state: { position: { x: 1, y: 1 } } });

    const log = await app.inject({ method: "GET", url: `/games/${id}/events` });
    expect(log.json().events.map((e: { type: string }) => e.type)).toEqual([
      "CHARACTER_CREATED",
      "POSITION_CHANGED",
    ]);
  });

  it("rejects a move when no floor is loaded", async () => {
    const { id } = await createGame();
    const res = await move(id, 0, "east");
    expect(res.statusCode).toBe(422);
  });

  it("rejects a move into a wall", async () => {
    const { id } = await createGame();
    await seedFloor(id, 1);
    expect((await move(id, 1, "east")).statusCode).toBe(422);
    expect((await move(id, 1, "north")).statusCode).toBe(422);
  });

  it("rejects a move off the map", async () => {
    const { id } = await createGame();
    await seedFloor(id, 0);
    const res = await move(id, 1, "west"); // would be x = -1
    expect(res.statusCode).toBe(422);
  });

  it("does not let the client send raw state changes like ADD_ITEM", async () => {
    const { id } = await createGame();
    const res = await app.inject({
      method: "POST",
      url: `/games/${id}/actions`,
      payload: { expectedVersion: 0, intent: { type: "ADD_ITEM", item: { id: "sword" } } },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects equipping an item the player doesn't own", async () => {
    const { id } = await createGame();
    const res = await app.inject({
      method: "POST",
      url: `/games/${id}/actions`,
      payload: { expectedVersion: 0, intent: { type: "equip", itemId: "legendary_sword" } },
    });
    expect(res.statusCode).toBe(422);
  });

  it("returns 409 on a stale version (optimistic locking)", async () => {
    const { id } = await createGame();
    await seedFloor(id, 0);
    expect((await move(id, 1, "east")).statusCode).toBe(200);
    expect((await move(id, 1, "west")).statusCode).toBe(409);
  });

  it("returns 404 for the event log of an unknown game", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/games/00000000-0000-4000-8000-000000000000/events",
    });
    expect(res.statusCode).toBe(404);
  });
});
