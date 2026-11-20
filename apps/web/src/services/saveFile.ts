import { MAX_SAVE_BYTES, parseSession } from "./session";

/** Reads a save file and returns its signed snapshot. The server decides if it is genuine. */
export const importSaveFile = async (file: File): Promise<string> => {
  if (file.size > MAX_SAVE_BYTES) throw new Error("Save file is too large");
  const session = parseSession(await file.text());
  if (!session) throw new Error("This is not a valid Grunberg save file");
  return session.snapshot;
};
