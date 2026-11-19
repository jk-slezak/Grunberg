import { describe, expect, it } from "vitest";
import { createInitialGameState, gameStateSchema } from "../src";

describe("gameStateSchema", () => {
  it("accepts the initial state", () => {
    expect(gameStateSchema.safeParse(createInitialGameState(0)).success).toBe(true);
  });

  it("rejects states outside the engine's bounds", () => {
    const state = createInitialGameState(0);
    const huge = { ...state, flags: Object.fromEntries([["x".repeat(65), true]]) };
    const negative = {
      ...state,
      inventory: { ...state.inventory, currency: { gold: -1, gems: 0 } },
    };
    expect(gameStateSchema.safeParse(huge).success).toBe(false);
    expect(gameStateSchema.safeParse(negative).success).toBe(false);
  });
});
