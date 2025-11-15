import { useEffect, useRef } from "react";
import type { GameState } from "../types/gameState";
import { SaveService } from "../services/SaveService";
import { gameEventBus } from "../core/GameEventBus";

const AUTOSAVE_DELAY = 500;

export const useAutoSave = (state: GameState, enabled: boolean = true) => {
  const timeoutRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);
  const lastSaveRef = useRef<string>("");

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!enabled || !state.character) {
      return;
    }

    const currentStateString = JSON.stringify(state);
    if (currentStateString === lastSaveRef.current) {
      return;
    }

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const success = SaveService.saveToLocalStorage(state);
      if (success) {
        lastSaveRef.current = JSON.stringify(state);
        gameEventBus.emit("GAME_SAVED", { timestamp: Date.now() });
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, enabled]);
};

