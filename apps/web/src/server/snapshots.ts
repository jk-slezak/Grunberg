import type { GameState } from "@grunberg/engine";
import {
  MAX_SNAPSHOT_LENGTH,
  MIN_SNAPSHOT_SECRET_LENGTH,
  signSnapshot,
  verifySnapshot,
  type StoredGame,
} from "@grunberg/game-server";

/** Room for a snapshot plus the JSON around it. Larger bodies are refused while reading. */
export const MAX_RESTORE_BODY_BYTES = MAX_SNAPSHOT_LENGTH + 1024;

// Public on purpose: only ever used outside production, where saves are worthless.
const DEV_SECRET = "grunberg-local-development-snapshot-secret";

const readSecret = (): string => {
  const secret = process.env.SNAPSHOT_SECRET;
  if (secret) {
    if (secret.length < MIN_SNAPSHOT_SECRET_LENGTH) {
      throw new Error(`SNAPSHOT_SECRET must be at least ${MIN_SNAPSHOT_SECRET_LENGTH} characters`);
    }
    return secret;
  }
  // A known key in production would let anyone forge saves: refuse to run instead.
  if (process.env.NODE_ENV === "production") {
    throw new Error("SNAPSHOT_SECRET is required in production");
  }
  return DEV_SECRET;
};

/** What the API returns for a game: the stored game plus its signed snapshot. */
export const withSnapshot = <T extends StoredGame>(game: T) => ({
  ...game,
  snapshot: signSnapshot(game.state, readSecret()),
});

export const openSnapshot = (token: string): GameState => verifySnapshot(token, readSecret());
