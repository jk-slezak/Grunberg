import { enforceRateLimit, type RateLimitRule } from "@grunberg/game-server";
import { getStore } from "./store";

// Global limits on writes, sized for the free database tier (every intent stores events).
// Per-IP limits live in Vercel Firewall, so no client data is stored here.
export const RULES = {
  createGame: { name: "create-game", limit: 300, windowSeconds: 60 * 60 },
  action: { name: "action", limit: 600, windowSeconds: 60 },
} satisfies Record<string, RateLimitRule>;

/** `cost` is how much of the limit a request uses, e.g. the number of intents it carries. */
export const rateLimit = (rule: RateLimitRule, cost = 1) =>
  enforceRateLimit(getStore().rateLimits, rule, "global", Date.now(), cost);
