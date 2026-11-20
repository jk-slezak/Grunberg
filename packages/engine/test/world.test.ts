import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  applyAction,
  applyIntents,
  createInitialGameState,
  FLOOR_SIZE,
  generateFloor,
  VIEW_RADIUS,
  type Character,
  type DungeonFloor,
  type GameState,
  type Intent,
  type MapTile,
} from "../src";

const NOW = 1_700_000_000_000;
const ctx = { now: NOW };

const hero: Character = {
  name: "Aria",
  race: "Elf",
  gender: false,
  class: "Mage",
  stats: { strength: 3, agility: 7, intelligence: 7 },
};

const seeds = fc.string({ minLength: 1, maxLength: 36 });

const walkable = (floor: DungeonFloor) => floor.tiles.flat().filter((t) => t.type !== "wall");

/** Every walkable tile reachable from (x, y) by steps north/south/east/west. */
const reachableFrom = (floor: DungeonFloor, x: number, y: number) => {
  const seen = new Set<string>();
  const queue = [{ x, y }];
  while (queue.length > 0) {
    const p = queue.pop()!;
    const tile = floor.tiles[p.y]?.[p.x];
    if (!tile || tile.type === "wall" || seen.has(`${p.x},${p.y}`)) continue;
    seen.add(`${p.x},${p.y}`);
    queue.push(
      { x: p.x + 1, y: p.y },
      { x: p.x - 1, y: p.y },
      { x: p.x, y: p.y + 1 },
      { x: p.x, y: p.y - 1 },
    );
  }
  return seen.size;
};

/** A hero standing on a generated floor 1. */
const onFloor = (seed = "test-seed"): GameState => {
  const created = applyAction(
    createInitialGameState(NOW),
    { type: "CREATE_CHARACTER", payload: hero },
    ctx,
  ).state;
  return applyAction(created, { type: "ENTER_FLOOR", payload: { floorNumber: 1, seed } }, ctx)
    .state;
};

/** A hand-made 3×3 floor: only the middle row is open, the player stands at (0, 1). */
const corridor = (): GameState => {
  const tiles = [0, 1, 2].map((y) =>
    [0, 1, 2].map((x): MapTile => ({
      x,
      y,
      type: y === 1 ? "empty" : "wall",
      explored: false,
      visible: false,
    })),
  );
  return {
    ...onFloor(),
    currentFloor: { floorNumber: 1, seed: "hand-made", enemies: [], npcs: [], tiles },
    position: { floor: 1, x: 0, y: 1 },
  };
};

const move = (direction: "north" | "south" | "east" | "west"): Intent => ({
  type: "move",
  direction,
});

describe("generateFloor", () => {
  it("is deterministic: the same seed gives the same floor", () => {
    fc.assert(
      fc.property(seeds, fc.integer({ min: 1, max: 99 }), (seed, n) => {
        expect(generateFloor(seed, n)).toEqual(generateFloor(seed, n));
      }),
    );
  });

  it("gives different floors for different floor numbers", () => {
    expect(generateFloor("seed", 1).floor.tiles).not.toEqual(generateFloor("seed", 2).floor.tiles);
  });

  it("builds a walled, fully connected floor with a walkable spawn and stairs down", () => {
    fc.assert(
      fc.property(seeds, (seed) => {
        const { floor, spawn } = generateFloor(seed, 1);
        const tiles = floor.tiles.flat();

        expect(floor.tiles).toHaveLength(FLOOR_SIZE);
        expect(floor.tiles.every((row) => row.length === FLOOR_SIZE)).toBe(true);
        const border = tiles.filter(
          (t) => t.x === 0 || t.y === 0 || t.x === FLOOR_SIZE - 1 || t.y === FLOOR_SIZE - 1,
        );
        expect(border.every((t) => t.type === "wall")).toBe(true);

        expect(floor.tiles[spawn.y][spawn.x].type).toBe("empty");
        expect(tiles.filter((t) => t.type === "stairs_down")).toHaveLength(1);
        expect(reachableFrom(floor, spawn.x, spawn.y)).toBe(walkable(floor).length);
        expect(tiles.every((t) => !t.explored && !t.visible)).toBe(true);
      }),
    );
  });
});

describe("ENTER_FLOOR", () => {
  it("places the player on the spawn and reveals only the tiles around it", () => {
    const state = onFloor();
    const { spawn } = generateFloor("test-seed", 1);
    const near = (t: MapTile) =>
      Math.abs(t.x - spawn.x) <= VIEW_RADIUS && Math.abs(t.y - spawn.y) <= VIEW_RADIUS;

    expect(state.position).toEqual(spawn);
    const tiles = state.currentFloor!.tiles.flat();
    expect(tiles.every((t) => t.explored === near(t) && t.visible === near(t))).toBe(true);
  });

  it("reports the floor change, the new position and how many tiles were revealed", () => {
    const created = applyAction(
      createInitialGameState(NOW),
      { type: "CREATE_CHARACTER", payload: hero },
      ctx,
    ).state;
    const { events } = applyAction(
      created,
      { type: "ENTER_FLOOR", payload: { floorNumber: 1, seed: "s" } },
      ctx,
    );
    const side = 2 * VIEW_RADIUS + 1;
    expect(events).toEqual([
      { type: "FLOOR_CHANGED", data: { oldFloor: 0, newFloor: 1 } },
      { type: "POSITION_CHANGED", data: expect.objectContaining({ floor: 1 }) },
      { type: "TILES_REVEALED", data: { floor: 1, count: side * side } },
    ]);
  });
});

describe("applyIntents", () => {
  it("moves the player and reveals newly seen tiles", () => {
    const { state, events, rejected } = applyIntents(corridor(), [move("east")], ctx);

    expect(rejected).toBeUndefined();
    expect(state.position).toEqual({ floor: 1, x: 1, y: 1 });
    expect(events.map((e) => e.type)).toEqual(["POSITION_CHANGED", "TILES_REVEALED"]);
    expect(state.currentFloor!.tiles.flat().every((t) => t.explored)).toBe(true);
  });

  it("does not report revealed tiles twice", () => {
    const { events } = applyIntents(corridor(), [move("east"), move("west")], ctx);
    expect(events.map((e) => e.type)).toEqual([
      "POSITION_CHANGED",
      "TILES_REVEALED",
      "POSITION_CHANGED",
    ]);
  });

  it.each([
    ["a wall", move("north"), "blocked"],
    ["the edge of the map", move("west"), "blocked"],
  ] as const)("refuses a move into %s and leaves the state untouched", (_, intent, reason) => {
    const before = corridor();
    const { state, events, rejected } = applyIntents(before, [intent], ctx);
    expect(rejected).toEqual({ index: 0, reason });
    expect(state).toBe(before);
    expect(events).toEqual([]);
  });

  it("refuses to move before there is a floor or a character", () => {
    const noFloor = { ...onFloor(), currentFloor: null };
    expect(applyIntents(noFloor, [move("east")], ctx).rejected?.reason).toBe("no_floor");
    expect(applyIntents(createInitialGameState(NOW), [move("east")], ctx).rejected?.reason).toBe(
      "no_character",
    );
  });

  it("refuses an intent the rules ignore (equipping an item the player doesn't own)", () => {
    const { rejected } = applyIntents(onFloor(), [{ type: "equip", itemId: "sword" }], ctx);
    expect(rejected).toEqual({ index: 0, reason: "no_effect" });
  });

  it("keeps the moves before a refused one and drops everything after it", () => {
    const { state, rejected } = applyIntents(
      corridor(),
      [move("east"), move("north"), move("east")],
      ctx,
    );
    expect(rejected).toEqual({ index: 1, reason: "blocked" });
    expect(state.position).toMatchObject({ x: 1, y: 1 });
  });

  it("never walks through walls or off the map, whatever the player tries", () => {
    const directions = fc.constantFrom("north", "south", "east", "west") as fc.Arbitrary<
      "north" | "south" | "east" | "west"
    >;
    fc.assert(
      fc.property(seeds, fc.array(directions, { maxLength: 40 }), (seed, path) => {
        let state = onFloor(seed);
        for (const direction of path) state = applyIntents(state, [move(direction)], ctx).state;
        expect(state.currentFloor!.tiles[state.position.y][state.position.x].type).not.toBe("wall");
      }),
      { numRuns: 50 },
    );
  });
});
