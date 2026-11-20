import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { applyAction, createInitialGameState } from "@grunberg/engine";
import { InvalidSnapshot, MAX_SNAPSHOT_LENGTH, signSnapshot, verifySnapshot } from "../src";

const NOW = 1_700_000_000_000;
const SECRET = "a".repeat(32);

const state = applyAction(
  createInitialGameState(NOW),
  { type: "UPDATE_CURRENCY", payload: { type: "gold", amount: 50 } },
  { now: NOW },
).state;

const reencode = (token: string, edit: (json: string) => string) => {
  const [format, payload, signature] = token.split(".");
  const json = Buffer.from(payload, "base64url").toString("utf8");
  return `${format}.${Buffer.from(edit(json)).toString("base64url")}.${signature}`;
};

describe("snapshots", () => {
  it("round-trips a state signed with the same secret", () => {
    expect(verifySnapshot(signSnapshot(state, SECRET), SECRET)).toEqual(state);
  });

  it("rejects a state edited by the player (more gold)", () => {
    const tampered = reencode(signSnapshot(state, SECRET), (json) =>
      json.replace('"gold":50', '"gold":99999'),
    );
    expect(() => verifySnapshot(tampered, SECRET)).toThrow(InvalidSnapshot);
  });

  it("rejects a snapshot signed with another secret", () => {
    expect(() => verifySnapshot(signSnapshot(state, "b".repeat(32)), SECRET)).toThrow(
      InvalidSnapshot,
    );
  });

  it("rejects a signature moved onto another payload", () => {
    const signature = signSnapshot(state, SECRET).split(".")[2];
    const other = signSnapshot(createInitialGameState(NOW), SECRET).split(".");
    expect(() => verifySnapshot(`${other[0]}.${other[1]}.${signature}`, SECRET)).toThrow(
      InvalidSnapshot,
    );
  });

  it.each([
    ["an empty string", ""],
    ["garbage", "not-a-snapshot"],
    ["an unknown format", signSnapshot(state, SECRET).replace(/^v1/, "v2")],
    ["an extra part", `${signSnapshot(state, SECRET)}.x`],
    ["a truncated signature", signSnapshot(state, SECRET).slice(0, -4)],
    ["an oversized token", `v1.${"a".repeat(MAX_SNAPSHOT_LENGTH)}.x`],
  ])("rejects %s", (_, token) => {
    expect(() => verifySnapshot(token, SECRET)).toThrow(InvalidSnapshot);
  });

  it("rejects a correctly signed payload that is not a valid game state", () => {
    const payload = Buffer.from(JSON.stringify({ hello: "world" })).toString("base64url");
    const signature = createHmac("sha256", SECRET)
      .update(`grunberg-snapshot.v1.${payload}`)
      .digest("base64url");
    expect(() => verifySnapshot(`v1.${payload}.${signature}`, SECRET)).toThrow(InvalidSnapshot);
  });
});
