import { event } from "../events";
import type { CharacterStats, CharacterStatus } from "../types";
import { unchanged, type Handlers } from "./core";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const STARTING_HP = 100;
export const STARTING_MP = 50;
export const EXP_TO_LEVEL_2 = 100;

export const createCharacterStatus = (stats: CharacterStats): CharacterStatus => ({
  hp: STARTING_HP,
  maxHp: STARTING_HP,
  mp: STARTING_MP,
  maxMp: STARTING_MP,
  exp: 0,
  expToNextLevel: EXP_TO_LEVEL_2,
  level: 1,
  currentStats: stats,
  statusEffects: [],
});

export const characterRules = {
  CREATE_CHARACTER: (state, { payload: character }) => ({
    state: { ...state, character, characterStatus: createCharacterStatus(character.stats) },
    events: [
      event("CHARACTER_CREATED", {
        characterName: character.name,
        characterClass: character.class,
      }),
    ],
  }),

  UPDATE_CHARACTER_STATUS: (state, { payload }) => {
    if (!state.characterStatus) return unchanged(state);

    const next: CharacterStatus = { ...state.characterStatus, ...payload };
    next.maxHp = Math.max(1, next.maxHp);
    next.maxMp = Math.max(0, next.maxMp);
    next.hp = clamp(next.hp, 0, next.maxHp);
    next.mp = clamp(next.mp, 0, next.maxMp);
    next.exp = Math.max(0, next.exp);

    return {
      state: { ...state, characterStatus: next },
      events: [event("CHARACTER_STATUS_UPDATED", { hp: next.hp, mp: next.mp, exp: next.exp })],
    };
  },
} satisfies Pick<Handlers, "CREATE_CHARACTER" | "UPDATE_CHARACTER_STATUS">;
