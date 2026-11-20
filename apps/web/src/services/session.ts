import { z } from "zod";
import type { GameView } from "../api/client";

/**
 * The player's local copy of their game: which server game they are playing and its latest
 * signed snapshot. The snapshot lets the server restore the game after its copy expires.
 * Version 1 saves held a raw, unsigned state; they can't be trusted and are ignored.
 */
export const SAVE_VERSION = "2.0.0";
const SESSION_KEY = "grunberg_save";
/** Generous upper bound for a save; the server checks the snapshot itself. */
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

export const readRawSession = (): string | null => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null; // storage disabled (private mode, blocked site data)
  }
};

export const loadSession = (): Session | null => parseSession(readRawSession());

export const saveSession = (game: GameView, now: number): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(createSession(game, now)));
  } catch (error) {
    // Full or disabled storage: the game goes on, it just can't be continued later.
    console.error("Failed to save game:", error);
  }
};
