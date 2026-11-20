import { createHmac, timingSafeEqual } from "node:crypto";
import { gameStateSchema, type GameState } from "@grunberg/engine";
import { InvalidSnapshot } from "./errors";

/**
 * Signed snapshots let a player keep a game beyond the server's 24 h retention without trusting
 * the client: the server signs every state it hands out and later accepts back only a state it
 * signed itself. Format: `v1.<base64url state JSON>.<base64url HMAC-SHA256>`.
 *
 * Not encrypted: the player may read their own state. They just can't change it.
 * Restoring an *older* snapshot of one's own game is possible and accepted (single player).
 */
const FORMAT = "v1";

/** Comfortably above a real game state (~50 KB encoded), far below anything costly to process. */
export const MAX_SNAPSHOT_LENGTH = 200_000;

/** HMAC-SHA256 keys shorter than this are too easy to guess. */
export const MIN_SNAPSHOT_SECRET_LENGTH = 32;

// The purpose and format are part of the MAC, so a signature can't be reused for anything else.
const mac = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(`grunberg-snapshot.${FORMAT}.${payload}`).digest();

export const signSnapshot = (state: GameState, secret: string): string => {
  const payload = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  return `${FORMAT}.${payload}.${mac(payload, secret).toString("base64url")}`;
};

/** Returns the signed state, or throws InvalidSnapshot. Nothing is parsed before the MAC checks out. */
export const verifySnapshot = (token: string, secret: string): GameState => {
  if (token.length > MAX_SNAPSHOT_LENGTH) throw new InvalidSnapshot();
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== FORMAT) throw new InvalidSnapshot();
  const [, payload, signature] = parts;

  const expected = mac(payload, secret);
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new InvalidSnapshot();
  }

  // Signed by us, but validated anyway: an old snapshot may predate today's state schema.
  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new InvalidSnapshot();
  }
  const result = gameStateSchema.safeParse(json);
  if (!result.success) throw new InvalidSnapshot();
  return result.data;
};
