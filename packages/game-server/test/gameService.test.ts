import { beforeEach, describe, expect, it } from "vitest";
import type { Character, DungeonFloor, MapTile } from "@grunberg/engine";
import {
  createGame,
  GAME_TTL_MS,
  GameNotFound,
  getEvents,
  getGame,
  InMemoryGameRepository,
  IntentRejected,
  performIntent,
  StaleVersion,
  type Intent,
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
    repo = new InMemoryGameRepository();
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

  const move = (
    id: string,
    expectedVersion: number,
    direction: "north" | "south" | "east" | "west",
  ) => performIntent(repo, id, expectedVersion, { type: "move", direction }, NOW);

  it("creates a game with the character and its starting status", async () => {
    const { id } = await newGame();
    expect(await getGame(repo, id, NOW)).toMatchObject({
      version: 0,
      state: { character: { name: "Aria" }, characterStatus: { hp: 100 } },
    });
  });

  it("applies a move, bumps the version and logs the event", async () => {
    const { id } = await newGame(0);

    const result = await move(id, 1, "east");

    expect(result).toMatchObject({ version: 2, state: { position: { x: 1, y: 1 } } });
    expect((await getEvents(repo, id, NOW)).map((e) => e.type)).toEqual([
      "CHARACTER_CREATED",
      "POSITION_CHANGED",
    ]);
  });

  it("rejects a move when no floor is loaded", async () => {
    const { id } = await newGame();
    await expect(move(id, 0, "east")).rejects.toBeInstanceOf(IntentRejected);
  });

  it("rejects a move into a wall", async () => {
    const { id } = await newGame(1);
    await expect(move(id, 1, "east")).rejects.toBeInstanceOf(IntentRejected);
    await expect(move(id, 1, "north")).rejects.toBeInstanceOf(IntentRejected);
  });

  it("rejects a move off the map", async () => {
    const { id } = await newGame(0);
    await expect(move(id, 1, "west")).rejects.toBeInstanceOf(IntentRejected);
  });

  it("rejects equipping an item the player doesn't own", async () => {
    const { id } = await newGame();
    const intent: Intent = { type: "equip", itemId: "legendary_sword" };
    await expect(performIntent(repo, id, 0, intent, NOW)).rejects.toBeInstanceOf(IntentRejected);
  });

  it("rejects a stale version and returns the current game", async () => {
    const { id } = await newGame(0);
    await move(id, 1, "east");

    const error = await move(id, 1, "west").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(StaleVersion);
    expect((error as StaleVersion).current.version).toBe(2);
  });

  it("treats games inactive for more than 24 hours as gone", async () => {
    const { id } = await newGame(0);
    const later = Date.now() + GAME_TTL_MS + 1000;

    await expect(getGame(repo, id, later)).rejects.toBeInstanceOf(GameNotFound);
    await expect(
      performIntent(repo, id, 1, { type: "move", direction: "east" }, later),
    ).rejects.toBeInstanceOf(GameNotFound);
    expect((await getGame(repo, id, Date.now())).id).toBe(id);
  });

  it("deletes expired games", async () => {
    const { id } = await newGame();
    expect(await repo.deleteInactive(new Date(Date.now() + 1000))).toBe(1);
    await expect(getGame(repo, id, NOW)).rejects.toBeInstanceOf(GameNotFound);
  });

  it("reports unknown games as not found", async () => {
    await expect(getGame(repo, UNKNOWN_ID, NOW)).rejects.toBeInstanceOf(GameNotFound);
    await expect(getEvents(repo, UNKNOWN_ID, NOW)).rejects.toBeInstanceOf(GameNotFound);
    await expect(move(UNKNOWN_ID, 0, "east")).rejects.toBeInstanceOf(GameNotFound);
  });
});
