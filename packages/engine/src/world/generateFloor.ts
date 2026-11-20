import type { DungeonFloor, MapTile, Position } from "../types/gameState";
import { createRandom, type Random } from "./random";

export const FLOOR_SIZE = 24;
const ROOM_ATTEMPTS = 40;
const MIN_ROOM = 3;
const MAX_ROOM = 6;

interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

type TileType = MapTile["type"];
interface Point {
  x: number;
  y: number;
}

const center = (room: Room): Point => ({
  x: room.x + Math.floor(room.width / 2),
  y: room.y + Math.floor(room.height / 2),
});

/** Rooms keep one wall tile between each other, so they never merge into one blob. */
const overlaps = (a: Room, b: Room) =>
  a.x <= b.x + b.width && b.x <= a.x + a.width && a.y <= b.y + b.height && b.y <= a.y + a.height;

const placeRooms = (random: Random): Room[] => {
  const rooms: Room[] = [];
  for (let i = 0; i < ROOM_ATTEMPTS; i++) {
    const width = random.int(MIN_ROOM, MAX_ROOM);
    const height = random.int(MIN_ROOM, MAX_ROOM);
    // Inside the border: the outermost ring of the map is always wall.
    const room = {
      x: random.int(1, FLOOR_SIZE - width - 1),
      y: random.int(1, FLOOR_SIZE - height - 1),
      width,
      height,
    };
    if (!rooms.some((other) => overlaps(room, other))) rooms.push(room);
  }
  return rooms;
};

const carveRoom = (grid: TileType[][], room: Room) => {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) grid[y][x] = "empty";
  }
};

/** An L-shaped corridor. Linking every room to the previous one keeps the whole floor connected. */
const carveCorridor = (grid: TileType[][], from: Point, to: Point, random: Random) => {
  const corner = random.next() < 0.5 ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
  for (const [a, b] of [
    [from, corner],
    [corner, to],
  ]) {
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) {
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) grid[y][x] = "empty";
    }
  }
};

/**
 * Builds a floor from a seed: rooms joined by corridors, walls all around, a spawn point in the
 * first room and stairs down in the last one. Pure: the same seed always gives the same floor.
 */
export const generateFloor = (
  seed: string,
  floorNumber: number,
): { floor: DungeonFloor; spawn: Position } => {
  const random = createRandom(`${seed}:${floorNumber}`);
  const grid: TileType[][] = Array.from({ length: FLOOR_SIZE }, () =>
    Array<TileType>(FLOOR_SIZE).fill("wall"),
  );

  // The first attempt always fits on an empty map, so there is at least one room.
  const rooms = placeRooms(random);
  rooms.forEach((room, i) => {
    carveRoom(grid, room);
    if (i > 0) carveCorridor(grid, center(rooms[i - 1]), center(room), random);
  });

  const start = center(rooms[0]);
  const last = rooms[rooms.length - 1];
  const stairs = rooms.length > 1 ? center(last) : { x: last.x, y: last.y };
  grid[stairs.y][stairs.x] = "stairs_down";

  const tiles = grid.map((row, y) =>
    row.map((type, x): MapTile => ({ x, y, type, explored: false, visible: false })),
  );
  return {
    floor: { floorNumber, tiles, seed, enemies: [], npcs: [] },
    spawn: { floor: floorNumber, ...start },
  };
};
