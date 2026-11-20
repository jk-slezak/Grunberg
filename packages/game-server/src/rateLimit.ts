import { RateLimited } from "./errors";

export interface RateLimitStore {
  /** Adds `cost` to the counter of `key` in the given window and returns the new total. */
  hit(key: string, windowStart: Date, cost: number): Promise<number>;
  purge(before: Date): Promise<void>;
}

export interface RateLimitRule {
  name: string;
  limit: number;
  windowSeconds: number;
}

export const enforceRateLimit = async (
  store: RateLimitStore,
  rule: RateLimitRule,
  clientKey: string,
  now: number,
  /** How much this request uses up, e.g. the number of intents in a batch. */
  cost = 1,
): Promise<void> => {
  if (!Number.isInteger(cost) || cost < 1) throw new RangeError("Rate limit cost must be >= 1");
  const windowMs = rule.windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const count = await store.hit(`${rule.name}:${clientKey}`, new Date(windowStart), cost);
  if (count > rule.limit) {
    throw new RateLimited(Math.ceil((windowStart + windowMs - now) / 1000));
  }
};

export class InMemoryRateLimitStore implements RateLimitStore {
  private counters = new Map<string, { windowStart: Date; count: number }>();

  async hit(key: string, windowStart: Date, cost: number) {
    const id = `${key}@${windowStart.getTime()}`;
    const count = (this.counters.get(id)?.count ?? 0) + cost;
    this.counters.set(id, { windowStart, count });
    return count;
  }

  async purge(before: Date) {
    for (const [id, { windowStart }] of this.counters) {
      if (windowStart < before) this.counters.delete(id);
    }
  }
}
