import type { GameState } from "@grunberg/engine";
import { createSaveData, parseSaveData } from "./saveData";

const SAVE_KEY = "grunberg_save";

export const readRawSave = (): string | null => localStorage.getItem(SAVE_KEY);

export const loadSavedGame = (): GameState | null => parseSaveData(readRawSave())?.state ?? null;

export const saveGame = (state: GameState, now: number): string | null => {
  try {
    const serialized = JSON.stringify(createSaveData(state, now));
    localStorage.setItem(SAVE_KEY, serialized);
    return serialized;
  } catch (error) {
    console.error("Failed to save game:", error);
    return null;
  }
};
