import type { GameState } from "@grunberg/engine";
import { createSaveData, parseSaveData } from "./saveData";

export const MAX_SAVE_FILE_BYTES = 1024 * 1024;

export const importSaveFile = async (file: File): Promise<GameState> => {
  if (file.size > MAX_SAVE_FILE_BYTES) throw new Error("Save file is too large");
  const save = parseSaveData(await file.text());
  if (!save) throw new Error("This is not a valid Grunberg save file");
  return save.state;
};

export const exportSaveFile = (state: GameState, now: number): void => {
  const blob = new Blob([JSON.stringify(createSaveData(state, now), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `grunberg_save_${new Date(now).toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
