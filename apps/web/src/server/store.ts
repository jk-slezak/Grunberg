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
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production");
  }
  return { games: new InMemoryGameRepository(), rateLimits: new InMemoryRateLimitStore() };
};

const globalForStore = globalThis as { grunbergStore?: Store };

export const getStore = (): Store => (globalForStore.grunbergStore ??= createStore());
