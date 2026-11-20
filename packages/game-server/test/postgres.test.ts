import { afterAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createInitialGameState, type GameEvent } from "@grunberg/engine";
import {
  activeSince,
  connectPostgres,
  createGame,
  enforceRateLimit,
  getEvents,
  performIntents,
  RateLimited,
  StaleVersion,
  VersionConflict,
} from "../src";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("Postgres", () => {
  const { games, rateLimits } = connectPostgres(url!);
  const NOW = 1_700_000_000_000;
  const INCLUDING_EXPIRED = new Date(0);
  const moved: GameEvent = { type: "POSITION_CHANGED", data: { floor: 0, x: 1, y: 0 } };
  const testRun = `test-${crypto.randomUUID()}`;

  const client = url ? postgres(url, { prepare: false }) : null;
  const db = client ? drizzle(client) : null;
  const createdIds: string[] = [];
  const track = <T extends { id: string }>(game: T) => (createdIds.push(game.id), game);

  afterAll(async () => {
    if (!db || !client) return;
    for (const id of createdIds)
      await db.execute(sql`DELETE FROM game_sessions WHERE id = ${id}::uuid`);
    await db.execute(sql`DELETE FROM rate_limits WHERE key LIKE ${`%${testRun}%`}`);
    await client.end();
  });

  describe("games", () => {
    it("creates a game, reads it back and stores the creation events", async () => {
      const state = createInitialGameState(NOW);
      const created = track(await games.create(state, [moved]));

      expect(created.version).toBe(0);
      expect(await games.get(created.id, INCLUDING_EXPIRED)).toEqual({
        id: created.id,
        version: 0,
        state,
      });
      expect(await games.events(created.id)).toEqual([moved]);
    });

    it("returns null for an unknown game", async () => {
      expect(await games.get("00000000-0000-4000-8000-000000000000", INCLUDING_EXPIRED)).toBeNull();
    });

    it("saves with optimistic locking and appends events in order", async () => {
      const { id, state } = track(await games.create(createInitialGameState(NOW), []));

      const saved = await games.save(id, 0, { ...state, flags: { visited: true } }, [moved]);
      expect(saved.version).toBe(1);
      expect((await games.get(id, INCLUDING_EXPIRED))?.state.flags).toEqual({ visited: true });

      await expect(games.save(id, 0, state, [])).rejects.toBeInstanceOf(VersionConflict);
      expect(await games.events(id)).toEqual([moved]);
    });

    it("lets only one of two concurrent saves win", async () => {
      const { id, state } = track(await games.create(createInitialGameState(NOW), []));

      const results = await Promise.allSettled([
        games.save(id, 0, state, [moved]),
        games.save(id, 0, state, [moved]),
      ]);

      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect((await games.get(id, INCLUDING_EXPIRED))?.version).toBe(1);
      expect(await games.events(id)).toHaveLength(1);
    });

    it("works end to end through the game service", async () => {
      const game = track(
        await createGame(
          games,
          {
            name: "Aria",
            race: "Elf",
            gender: false,
            class: "Mage",
            stats: { strength: 3, agility: 5, intelligence: 7 },
          },
          NOW,
        ),
      );
      expect((await getEvents(games, game.id, Date.now())).map((e) => e.type)).toEqual([
        "CHARACTER_CREATED",
        "FLOOR_CHANGED",
        "POSITION_CHANGED",
        "TILES_REVEALED",
      ]);

      await expect(
        performIntents(games, game.id, 5, [{ type: "move", direction: "east" }], Date.now()),
      ).rejects.toBeInstanceOf(StaleVersion);
    });

    it("hides games last updated before activeSince", async () => {
      const game = track(await games.create(createInitialGameState(NOW), []));
      await db!.execute(
        sql`UPDATE game_sessions SET updated_at = now() - interval '25 hours' WHERE id = ${game.id}::uuid`,
      );

      expect(await games.get(game.id, activeSince(Date.now()))).toBeNull();
      expect(await games.get(game.id, INCLUDING_EXPIRED)).not.toBeNull();
    });

    it("deletes games that were not updated since the cutoff, with their events", async () => {
      const stale = track(await games.create(createInitialGameState(NOW), [moved]));
      const active = track(await games.create(createInitialGameState(NOW), []));
      await db!.execute(
        sql`UPDATE game_sessions SET updated_at = '1999-01-01' WHERE id = ${stale.id}::uuid`,
      );

      expect(await games.deleteInactive(new Date("2000-01-01"))).toBe(1);
      expect(await games.get(stale.id, INCLUDING_EXPIRED)).toBeNull();
      expect(await games.events(stale.id)).toEqual([]);
      expect(await games.get(active.id, INCLUDING_EXPIRED)).not.toBeNull();
    });
  });

  describe("rate limits", () => {
    const rule = { name: `${testRun}-create`, limit: 3, windowSeconds: 60 };

    it("allows up to the limit in a window, then rejects with Retry-After", async () => {
      for (let i = 0; i < 3; i++) await enforceRateLimit(rateLimits, rule, "client-a", NOW);

      const error = await enforceRateLimit(rateLimits, rule, "client-a", NOW).catch(
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(RateLimited);
      expect((error as RateLimited).retryAfterSeconds).toBeGreaterThan(0);

      await enforceRateLimit(rateLimits, rule, "client-b", NOW);
      await enforceRateLimit(rateLimits, rule, "client-a", NOW + 60_000);
    });

    it("counts concurrent hits atomically", async () => {
      const key = `${testRun}-concurrent`;
      const windowStart = new Date(NOW);
      const counts = await Promise.all(
        Array.from({ length: 20 }, () => rateLimits.hit(key, windowStart)),
      );
      expect([...counts].sort((a, b) => a - b)).toEqual(
        Array.from({ length: 20 }, (_, i) => i + 1),
      );
    });
  });
});
