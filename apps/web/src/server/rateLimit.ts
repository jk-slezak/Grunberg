import { enforceRateLimit, type RateLimitRule } from "@grunberg/game-server";
import { getStore } from "./store";

// Global limits on writes, sized for the free database tier (every action is a stored event).
// Per-IP limits live in Vercel Firewall, so no client data is stored here.
export const RULES = {
  createGame: { name: "create-game", limit: 300, windowSeconds: 60 * 60 },
  action: { name: "action", limit: 600, windowSeconds: 60 },
} satisfies Record<string, RateLimitRule>;

export const rateLimit = (rule: RateLimitRule) =>
  enforceRateLimit(getStore().rateLimits, rule, "global", Date.now());
