import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { GameEvent } from "@grunberg/engine";
import type { RateLimitStore } from "../rateLimit";
import { VersionConflict, type GameRepository } from "../repository";
import { gameEvents, gameSessions, rateLimits } from "./schema";

type Db = ReturnType<typeof drizzle>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const insertEvents = async (tx: Tx, sessionId: string, version: number, events: GameEvent[]) => {
  if (events.length === 0) return;
  await tx
    .insert(gameEvents)
    .values(events.map((e) => ({ sessionId, version, type: e.type, data: e.data })));
};

const gameRepository = (db: Db): GameRepository => ({
  async create(state, events) {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .insert(gameSessions)
        .values({ state })
        .returning({ id: gameSessions.id, version: gameSessions.version });
      await insertEvents(tx, row.id, row.version, events);
      return { id: row.id, version: row.version, state };
    });
  },

  async get(id, activeSince) {
    const [row] = await db
      .select({ id: gameSessions.id, state: gameSessions.state, version: gameSessions.version })
      .from(gameSessions)
      .where(and(eq(gameSessions.id, id), gte(gameSessions.updatedAt, activeSince)));
    return row ?? null;
  },

  async save(id, expectedVersion, state, events) {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(gameSessions)
        .set({ state, version: sql`${gameSessions.version} + 1`, updatedAt: new Date() })
        .where(and(eq(gameSessions.id, id), eq(gameSessions.version, expectedVersion)))
        .returning({ version: gameSessions.version });
      if (!row) throw new VersionConflict();
      await insertEvents(tx, id, row.version, events);
      return { id, state, version: row.version };
    });
  },

  async events(id) {
    const rows = await db
      .select({ type: gameEvents.type, data: gameEvents.data })
      .from(gameEvents)
      .where(eq(gameEvents.sessionId, id))
      .orderBy(asc(gameEvents.id));
    return rows as GameEvent[];
  },

  async deleteInactive(before) {
    const deleted = await db
      .delete(gameSessions)
      .where(lt(gameSessions.updatedAt, before))
      .returning({ id: gameSessions.id });
    return deleted.length;
  },
});

const rateLimitStore = (db: Db): RateLimitStore => ({
  async hit(key, windowStart) {
    const [row] = await db
      .insert(rateLimits)
      .values({ key, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [rateLimits.key, rateLimits.windowStart],
        set: { count: sql`${rateLimits.count} + 1` },
      })
      .returning({ count: rateLimits.count });
    return row.count;
  },

  async purge(before) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, before));
  },
});

export const connectPostgres = (url: string) => {
  const db = drizzle(postgres(url, { prepare: false }));
  return { games: gameRepository(db), rateLimits: rateLimitStore(db) };
};
