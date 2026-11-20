import { describe, expect, it } from "vitest";
import { applyAction, createInitialGameState } from "@grunberg/engine";
import { locationName, toPlayerStats } from "./hud";

const NOW = 1_700_000_000_000;

describe("hud", () => {
  it("has no player stats before a character exists", () => {
    expect(toPlayerStats(createInitialGameState(NOW))).toBeNull();
  });

  it("maps the character's status, stats and gold", () => {
    const state = applyAction(
      createInitialGameState(NOW),
      {
        type: "CREATE_CHARACTER",
        payload: {
          name: "Aria",
          race: "Elf",
          gender: false,
          class: "Mage",
          stats: { strength: 3, agility: 5, intelligence: 7 },
        },
      },
      { now: NOW },
    ).state;
    const status = state.characterStatus!;

    expect(toPlayerStats(state)).toEqual({
      hp: { current: status.hp, max: status.maxHp },
      mana: { current: status.mp, max: status.maxMp },
      exp: { current: status.exp, max: status.expToNextLevel },
      stats: [
        { label: "Siła", value: status.currentStats.strength },
        { label: "Zręczność", value: status.currentStats.agility },
        { label: "Inteligencja", value: status.currentStats.intelligence },
      ],
      gold: 0,
    });
  });

  it("names the floor the player is on", () => {
    expect(locationName({ floor: 3, x: 0, y: 0 })).toBe("Mglista Wieża – piętro 3");
  });
});
