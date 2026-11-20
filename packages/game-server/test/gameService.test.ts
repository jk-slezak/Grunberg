import { beforeEach, describe, expect, it } from "vitest";
import type { Character, Direction, DungeonFloor, MapTile } from "@grunberg/engine";
import {
  createGame,
  FIRST_FLOOR,
  GAME_TTL_MS,
  GameNotFound,
  getEvents,
  getGame,
  InMemoryGameRepository,
  IntentRejected,
  MAX_REQUESTS_PER_GAME,
  performIntents,
  restoreGame,
  StaleVersion,
} from "../src";

const NOW = 1_700_000_000_000;

const character: Character = {
  name: "Aria",
  race: "Elf",
  gender: false,
  class: "Mage",
  stats: { strength: 3, agility: 7, intelligence: 7 },
};

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

const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

describe("gameService", () => {
  let repo: InMemoryGameRepository;

  beforeEach(() => {
    repo = new InMemoryGameRepository(() => NOW);
  });

  const newGame = async (onFloorAtX?: number) => {
    const game = await createGame(repo, character, NOW);
    if (onFloorAtX === undefined) return game;
    return repo.save(
      game.id,
      game.version,
      { ...game.state, currentFloor: floor, position: { floor: 0, x: onFloorAtX, y: 1 } },
      [],
    );
  };

  const moves = (id: string, expectedVersion: number, ...directions: Direction[]) =>
    performIntents(
      repo,
      id,
      expectedVersion,
      directions.map((direction) => ({ type: "move", direction })),
      NOW,
    );

  const rejection = (promise: Promise<unknown>) =>
    promise.then(
      () => null,
      (e: unknown) => (e instanceof IntentRejected ? e.reason : e),
    );

  it("creates a game with the character on a seeded first floor", async () => {
    const { id } = await newGame();
    const game = await getGame(repo, id, NOW);

    expect(game).toMatchObject({
      version: 0,
      state: {
        character: { name: "Aria" },
        characterStatus: { hp: 100 },
        position: { floor: FIRST_FLOOR },
        currentFloor: { floorNumber: FIRST_FLOOR },
      },
    });
    const { x, y } = game.state.position;
    expect(game.state.currentFloor!.tiles[y][x].type).toBe("empty");
    expect((await getEvents(repo, id, NOW)).map((e) => e.type)).toEqual([
      "CHARACTER_CREATED",
      "FLOOR_CHANGED",
      "POSITION_CHANGED",
      "TILES_REVEALED",
    ]);
  });

  it("gives every new game its own floor", async () => {
    const a = await newGame();
    const b = await newGame();
    expect(a.state.currentFloor!.seed).not.toBe(b.state.currentFloor!.seed);
  });

  it("applies a move, bumps the version and logs the events", async () => {
    const { id } = await newGame(0);

    const result = await moves(id, 1, "east");

    expect(result).toMatchObject({ version: 2, state: { position: { x: 1, y: 1 } } });
    expect(result.rejected).toBeUndefined();
    expect((await getEvents(repo, id, NOW)).slice(-2).map((e) => e.type)).toEqual([
      "POSITION_CHANGED",
      "TILES_REVEALED",
    ]);
  });

  it("applies a batch of moves as one new version", async () => {
    const { id } = await newGame(0);
    const result = await moves(id, 1, "east", "west", "east");
    expect(result).toMatchObject({ version: 2, state: { position: { x: 1, y: 1 } } });
  });

  it("keeps the moves before a refused one and reports which one failed", async () => {
    const { id } = await newGame(0);

    const result = await moves(id, 1, "east", "east", "west");

    expect(result.rejected).toEqual({ index: 1, reason: "blocked" });
    expect(result).toMatchObject({ version: 2, state: { position: { x: 1, y: 1 } } });
  });

  it("rejects a move when no floor is loaded", async () => {
    const { id, state } = await newGame();
    await repo.save(id, 0, { ...state, currentFloor: null }, []);
    expect(await rejection(moves(id, 1, "east"))).toBe("no_floor");
  });

  it("rejects a move into a wall without saving anything", async () => {
    const { id } = await newGame(1);
    expect(await rejection(moves(id, 1, "east"))).toBe("blocked");
    expect(await rejection(moves(id, 1, "north"))).toBe("blocked");
    expect((await getGame(repo, id, NOW)).version).toBe(1);
  });

  it("rejects a move off the map", async () => {
    const { id } = await newGame(0);
    expect(await rejection(moves(id, 1, "west"))).toBe("blocked");
  });

  it("rejects equipping an item the player doesn't own", async () => {
    const { id } = await newGame();
    const result = performIntents(repo, id, 0, [{ type: "equip", itemId: "legendary_sword" }], NOW);
    expect(await rejection(result)).toBe("no_effect");
  });

  it("restores a game from a state under a new id", async () => {
    const original = await newGame(0);
    const restored = await restoreGame(repo, original.state, NOW);

    expect(restored.id).not.toBe(original.id);
    expect(restored).toMatchObject({ version: 0, state: original.state });
    expect((await getEvents(repo, restored.id, NOW)).map((e) => e.type)).toEqual(["GAME_LOADED"]);
  });

  it("stops accepting actions once a game reaches its length limit", async () => {
    const { id, state, version } = await newGame(0);
    for (let v = version; v < MAX_REQUESTS_PER_GAME; v++) await repo.save(id, v, state, []);

    expect(await rejection(moves(id, MAX_REQUESTS_PER_GAME, "east"))).toBe("length_limit");
  });

  it("rejects a stale version and returns the current game", async () => {
    const { id } = await newGame(0);
    await moves(id, 1, "east");

    const error = await moves(id, 1, "west").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(StaleVersion);
    expect((error as StaleVersion).current.version).toBe(2);
  });

  it("treats games inactive for more than 24 hours as gone", async () => {
    const { id } = await newGame(0);
    const later = NOW + GAME_TTL_MS + 1000;

    await expect(getGame(repo, id, later)).rejects.toBeInstanceOf(GameNotFound);
    await expect(
      performIntents(repo, id, 1, [{ type: "move", direction: "east" }], later),
    ).rejects.toBeInstanceOf(GameNotFound);
    expect((await getGame(repo, id, NOW)).id).toBe(id);
  });

  it("deletes expired games", async () => {
    const { id } = await newGame();
    expect(await repo.deleteInactive(new Date(NOW + 1000))).toBe(1);
    await expect(getGame(repo, id, NOW)).rejects.toBeInstanceOf(GameNotFound);
  });

  it("reports unknown games as not found", async () => {
    await expect(getGame(repo, UNKNOWN_ID, NOW)).rejects.toBeInstanceOf(GameNotFound);
    await expect(getEvents(repo, UNKNOWN_ID, NOW)).rejects.toBeInstanceOf(GameNotFound);
    await expect(moves(UNKNOWN_ID, 0, "east")).rejects.toBeInstanceOf(GameNotFound);
  });
});
