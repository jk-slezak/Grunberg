import { useEffect, useRef } from "react";
import type { GameState } from "@grunberg/engine";
import { saveGame } from "../services/saveStorage";

const AUTOSAVE_DELAY_MS = 500;

export const useAutoSave = (state: GameState, enabled = true) => {
  const lastSaved = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !state.character) return;
    const serialized = JSON.stringify(state);
    if (serialized === lastSaved.current) return;

    const timeout = window.setTimeout(() => {
      if (saveGame(state, Date.now()) !== null) lastSaved.current = serialized;
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [state, enabled]);
};
