import type { RateLimitStore } from "./rateLimit";
import type { GameRepository } from "./repository";

export const GAME_TTL_MS = 24 * 60 * 60 * 1000;

export const activeSince = (now: number): Date => new Date(now - GAME_TTL_MS);

export const deleteExpiredData = async (
  games: GameRepository,
  rateLimits: RateLimitStore,
  now: number,
): Promise<{ deletedGames: number }> => {
  const cutoff = activeSince(now);
  const deletedGames = await games.deleteInactive(cutoff);
  await rateLimits.purge(cutoff);
  return { deletedGames };
};
