import { useMemo, useSyncExternalStore } from "react";
import { parseSaveData } from "../services/saveData";
import { readRawSave } from "../services/saveStorage";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

export const useSavedGame = () => {
  const raw = useSyncExternalStore(subscribe, readRawSave, () => null);
  return useMemo(() => {
    const save = parseSaveData(raw);
    return { hasSave: save !== null, savedAt: save?.timestamp ?? null };
  }, [raw]);
};
