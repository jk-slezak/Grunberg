import { z } from "zod";
import type { GameView } from "../api/client";

export const SAVE_VERSION = "2.0.0";
const SESSION_KEY = "grunberg_save";
export const MAX_SAVE_BYTES = 1024 * 1024;

const sessionSchema = z.object({
  version: z.literal(SAVE_VERSION),
  gameId: z.uuid(),
  snapshot: z.string().min(1).max(MAX_SAVE_BYTES),
  savedAt: z.number(),
});

export type Session = z.infer<typeof sessionSchema>;

export const createSession = (game: GameView, now: number): Session => ({
  version: SAVE_VERSION,
  gameId: game.id,
  snapshot: game.snapshot,
  savedAt: now,
});

export const parseSession = (serialized: string | null): Session | null => {
  if (!serialized || serialized.length > MAX_SAVE_BYTES) return null;
  try {
    const result = sessionSchema.safeParse(JSON.parse(serialized));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

const withStorage = <T>(operation: (storage: Storage) => T, whenUnavailable: T): T => {
  try {
    return operation(localStorage);
  } catch {
    return whenUnavailable;
  }
};

export const readRawSession = (): string | null =>
  withStorage((storage) => storage.getItem(SESSION_KEY), null);

export const loadSession = (): Session | null => parseSession(readRawSession());

export const clearSession = (): void =>
  withStorage((storage) => storage.removeItem(SESSION_KEY), undefined);

export const saveSession = (game: GameView, now: number): void =>
  withStorage(
    (storage) => storage.setItem(SESSION_KEY, JSON.stringify(createSession(game, now))),
    undefined,
  );
