import { useEffect, useRef } from "react";
import type { GameState } from "@grunberg/engine";
import { gameEventBus } from "../core/GameEventBus";
import { saveGame } from "../services/saveStorage";

const AUTOSAVE_DELAY_MS = 500;

export const useAutoSave = (state: GameState, enabled = true) => {
  const lastSaved = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !state.character) return;
    const serialized = JSON.stringify(state);
    if (serialized === lastSaved.current) return;

    const timeout = window.setTimeout(() => {
      const now = Date.now();
      if (saveGame(state, now) !== null) {
        lastSaved.current = serialized;
        gameEventBus.emit("GAME_SAVED", { timestamp: now });
      }
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [state, enabled]);
};
