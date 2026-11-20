import type { DungeonFloor, MapTile, Position } from "../types/gameState";
import { createSeededRandom, type Random } from "./random";

export const FLOOR_SIZE = 24;
const ROOM_ATTEMPTS = 40;
const MIN_ROOM = 3;
const MAX_ROOM = 6;
const BORDER_WIDTH = 1;

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

const touchesOrOverlaps = (a: Room, b: Room) =>
  a.x <= b.x + b.width && b.x <= a.x + a.width && a.y <= b.y + b.height && b.y <= a.y + a.height;

const placeRooms = (random: Random): Room[] => {
  const rooms: Room[] = [];
  for (let i = 0; i < ROOM_ATTEMPTS; i++) {
    const width = random.intInclusive(MIN_ROOM, MAX_ROOM);
    const height = random.intInclusive(MIN_ROOM, MAX_ROOM);
    const room = {
      x: random.intInclusive(BORDER_WIDTH, FLOOR_SIZE - width - BORDER_WIDTH),
      y: random.intInclusive(BORDER_WIDTH, FLOOR_SIZE - height - BORDER_WIDTH),
      width,
      height,
    };
    if (!rooms.some((other) => touchesOrOverlaps(room, other))) rooms.push(room);
  }
  return rooms;
};

const carveRoom = (grid: TileType[][], room: Room) => {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) grid[y][x] = "empty";
  }
};

const carveCorridor = (grid: TileType[][], from: Point, to: Point, random: Random) => {
  const corner = random.nextFloat() < 0.5 ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
  for (const [a, b] of [
    [from, corner],
    [corner, to],
  ]) {
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) {
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) grid[y][x] = "empty";
    }
  }
};

export const generateFloor = (
  seed: string,
  floorNumber: number,
): { floor: DungeonFloor; spawn: Position } => {
  const random = createSeededRandom(`${seed}:${floorNumber}`);
  const grid: TileType[][] = Array.from({ length: FLOOR_SIZE }, () =>
    Array<TileType>(FLOOR_SIZE).fill("wall"),
  );

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
