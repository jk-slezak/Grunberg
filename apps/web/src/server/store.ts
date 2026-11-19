import {
  connectPostgres,
  InMemoryGameRepository,
  InMemoryRateLimitStore,
  type GameRepository,
  type RateLimitStore,
} from "@grunberg/game-server";

interface Store {
  games: GameRepository;
  rateLimits: RateLimitStore;
}

const createStore = (): Store => {
  const url = process.env.DATABASE_URL;
  if (url) return connectPostgres(url);
  // Serverless instances don't share memory: in-memory storage would silently lose games.
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production");
  }
  return { games: new InMemoryGameRepository(), rateLimits: new InMemoryRateLimitStore() };
};

// Kept on globalThis so dev hot reloads don't wipe in-memory data or open new DB pools.
const globalForStore = globalThis as { grunbergStore?: Store };

export const getStore = (): Store => (globalForStore.grunbergStore ??= createStore());
