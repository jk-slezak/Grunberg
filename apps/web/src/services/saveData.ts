import { z } from "zod";
import { gameStateSchema, type GameState } from "@grunberg/engine";

export const SAVE_VERSION = "1.0.0";

const saveDataSchema = z.object({
  version: z.string().max(20),
  state: gameStateSchema,
  timestamp: z.number(),
});

export interface SaveData {
  version: string;
  state: GameState;
  timestamp: number;
}

export const createSaveData = (state: GameState, now: number): SaveData => ({
  version: SAVE_VERSION,
  state: { ...state, metadata: { ...state.metadata, lastSaved: now } },
  timestamp: now,
});

export const parseSaveData = (serialized: string | null): SaveData | null => {
  if (!serialized) return null;
  try {
    const result = saveDataSchema.safeParse(JSON.parse(serialized));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};
