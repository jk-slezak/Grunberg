import { useSyncExternalStore } from "react";
import type { GameState } from "@grunberg/engine";
import { useGameStore } from "./GameStateContext";

export const useGameState = (): GameState => {
  const store = useGameStore();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
};
