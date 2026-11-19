import { enforceRateLimit, type RateLimitRule } from "@grunberg/game-server";
import { getStore } from "./store";

export const RULES = {
  createGame: { name: "create-game", limit: 300, windowSeconds: 60 * 60 },
  action: { name: "action", limit: 3000, windowSeconds: 60 },
} satisfies Record<string, RateLimitRule>;

export const rateLimit = (rule: RateLimitRule) =>
  enforceRateLimit(getStore().rateLimits, rule, "global", Date.now());
