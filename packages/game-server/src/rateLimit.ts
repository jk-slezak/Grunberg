import { RateLimited } from "./errors";

export interface RateLimitStore {
  hit(key: string, windowStart: Date): Promise<number>;
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
): Promise<void> => {
  const windowMs = rule.windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const count = await store.hit(`${rule.name}:${clientKey}`, new Date(windowStart));
  if (count > rule.limit) {
    throw new RateLimited(Math.ceil((windowStart + windowMs - now) / 1000));
  }
};

export class InMemoryRateLimitStore implements RateLimitStore {
  private counters = new Map<string, { windowStart: Date; count: number }>();

  async hit(key: string, windowStart: Date) {
    const id = `${key}@${windowStart.getTime()}`;
    const count = (this.counters.get(id)?.count ?? 0) + 1;
    this.counters.set(id, { windowStart, count });
    return count;
  }

  async purge(before: Date) {
    for (const [id, { windowStart }] of this.counters) {
      if (windowStart < before) this.counters.delete(id);
    }
  }
}
