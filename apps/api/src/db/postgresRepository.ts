import { and, asc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { GameEvent, GameState } from "@grunberg/engine";
import { VersionConflict, type GameRepository } from "../repository";
import { gameEvents, gameSessions } from "./schema";

export const createPostgresRepository = (url: string): GameRepository => {
  const db = drizzle(postgres(url));

  return {
    async create(state, events) {
      return db.transaction(async (tx) => {
        const [row] = await tx
          .insert(gameSessions)
          .values({ state })
          .returning({ id: gameSessions.id, version: gameSessions.version });
        if (events.length) {
          await tx.insert(gameEvents).values(
            events.map((e) => ({ sessionId: row.id, version: 0, type: e.type, data: e.data })),
          );
        }
        return { id: row.id, version: row.version, state };
      });
    },

    async get(id) {
      const [row] = await db
        .select({ id: gameSessions.id, state: gameSessions.state, version: gameSessions.version })
        .from(gameSessions)
        .where(eq(gameSessions.id, id));
      return row ?? null;
    },

    async save(id, expectedVersion, state: GameState, events: GameEvent[]) {
      return db.transaction(async (tx) => {
        const [row] = await tx
          .update(gameSessions)
          .set({ state, version: sql`${gameSessions.version} + 1`, updatedAt: new Date() })
          .where(and(eq(gameSessions.id, id), eq(gameSessions.version, expectedVersion)))
          .returning({ version: gameSessions.version });
        if (!row) throw new VersionConflict();
        if (events.length) {
          await tx.insert(gameEvents).values(
            events.map((e) => ({ sessionId: id, version: row.version, type: e.type, data: e.data })),
          );
        }
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
  };
};
