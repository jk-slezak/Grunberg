import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const SECRET = "a".repeat(64);
const call = (authorization?: string) =>
  GET(
    new Request(
      "http://grunberg.test/api/cron/cleanup",
      authorization ? { headers: { authorization } } : {},
    ),
  );

describe("GET /api/cron/cleanup", () => {
  beforeEach(() => {
    delete (globalThis as { grunbergStore?: unknown }).grunbergStore;
  });
  afterEach(() => vi.unstubAllEnvs());

  it("401 without or with a wrong secret", async () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    expect((await call()).status).toBe(401);
    expect((await call(`Bearer ${"b".repeat(64)}`)).status).toBe(401);
    expect((await call(SECRET)).status).toBe(401);
  });

  it("stays closed when CRON_SECRET is not configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer ")).status).toBe(401);
    expect((await call("Bearer undefined")).status).toBe(401);
  });

  it("runs the cleanup with the right secret", async () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deletedGames: 0 });
  });
});
