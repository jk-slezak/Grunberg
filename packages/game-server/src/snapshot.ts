import { createHmac, timingSafeEqual } from "node:crypto";
import { gameStateSchema, type GameState } from "@grunberg/engine";
import { InvalidSnapshot } from "./errors";

const FORMAT = "v1";

export const MAX_SNAPSHOT_LENGTH = 200_000;

export const MIN_SNAPSHOT_SECRET_LENGTH = 32;

const SIGNATURE_PURPOSE = `grunberg-snapshot.${FORMAT}`;

const signatureOf = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(`${SIGNATURE_PURPOSE}.${payload}`).digest();

export const signSnapshot = (state: GameState, secret: string): string => {
  const payload = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  return `${FORMAT}.${payload}.${signatureOf(payload, secret).toString("base64url")}`;
};

const assertSignedWith = (payload: string, signature: string, secret: string): void => {
  const expected = signatureOf(payload, secret);
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new InvalidSnapshot();
  }
};

const parseGameState = (payload: string): GameState => {
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

export const verifySnapshot = (token: string, secret: string): GameState => {
  if (token.length > MAX_SNAPSHOT_LENGTH) throw new InvalidSnapshot();
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== FORMAT) throw new InvalidSnapshot();
  const [, payload, signature] = parts;

  assertSignedWith(payload, signature, secret);
  return parseGameState(payload);
};
