import type { DungeonFloor, GameState, Position } from "../types/gameState";

export const DIRECTIONS = ["north", "south", "east", "west"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const VIEW_RADIUS = 2;

const STEP: Record<Direction, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east: { dx: 1, dy: 0 },
  west: { dx: -1, dy: 0 },
};

export type MoveRejection = "no_floor" | "blocked";

export const moveTarget = (
  state: GameState,
  direction: Direction,
): { ok: true; target: Position } | { ok: false; reason: MoveRejection } => {
  if (!state.currentFloor) return { ok: false, reason: "no_floor" };
  const { dx, dy } = STEP[direction];
  const target = { ...state.position, x: state.position.x + dx, y: state.position.y + dy };
  const tile = state.currentFloor.tiles[target.y]?.[target.x];
  if (!tile || tile.type === "wall") return { ok: false, reason: "blocked" };
  return { ok: true, target };
};

export const revealAround = (
  floor: DungeonFloor,
  position: Position,
): { floor: DungeonFloor; revealed: number } => {
  let revealed = 0;
  const tiles = floor.tiles.map((row) =>
    row.map((tile) => {
      const visible =
        Math.abs(tile.x - position.x) <= VIEW_RADIUS &&
        Math.abs(tile.y - position.y) <= VIEW_RADIUS;
      const explored = tile.explored || visible;
      if (tile.visible === visible && tile.explored === explored) return tile;
      if (!tile.explored && explored) revealed++;
      return { ...tile, visible, explored };
    }),
  );
  return { floor: { ...floor, tiles }, revealed };
};
