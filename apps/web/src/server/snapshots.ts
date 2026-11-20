import type { GameState } from "@grunberg/engine";
import {
  MAX_SNAPSHOT_LENGTH,
  MIN_SNAPSHOT_SECRET_LENGTH,
  signSnapshot,
  verifySnapshot,
  type StoredGame,
} from "@grunberg/game-server";

export const MAX_RESTORE_BODY_BYTES = MAX_SNAPSHOT_LENGTH + 1024;

const PUBLIC_DEVELOPMENT_ONLY_SECRET = "grunberg-local-development-snapshot-secret";

const readSecret = (): string => {
  const secret = process.env.SNAPSHOT_SECRET;
  if (secret) {
    if (secret.length < MIN_SNAPSHOT_SECRET_LENGTH) {
      throw new Error(`SNAPSHOT_SECRET must be at least ${MIN_SNAPSHOT_SECRET_LENGTH} characters`);
    }
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SNAPSHOT_SECRET is required in production");
  }
  return PUBLIC_DEVELOPMENT_ONLY_SECRET;
};

export const withSnapshot = <T extends StoredGame>(game: T) => ({
  ...game,
  snapshot: signSnapshot(game.state, readSecret()),
});

export const openSnapshot = (token: string): GameState => verifySnapshot(token, readSecret());
