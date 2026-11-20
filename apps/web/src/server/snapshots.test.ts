import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "@grunberg/engine";
import { openSnapshot, withSnapshot } from "./snapshots";

const game = { id: "id", version: 0, state: createInitialGameState(0) };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("snapshot secret", () => {
  it("refuses to sign in production without SNAPSHOT_SECRET", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SNAPSHOT_SECRET", "");
    expect(() => withSnapshot(game)).toThrow("SNAPSHOT_SECRET is required");
  });

  it("refuses a secret that is too short", () => {
    vi.stubEnv("SNAPSHOT_SECRET", "short");
    expect(() => withSnapshot(game)).toThrow("at least");
  });

  it("does not accept snapshots signed with another secret", () => {
    vi.stubEnv("SNAPSHOT_SECRET", "a".repeat(32));
    const { snapshot } = withSnapshot(game);
    vi.stubEnv("SNAPSHOT_SECRET", "b".repeat(32));
    expect(() => openSnapshot(snapshot)).toThrow("Invalid");
  });
});
