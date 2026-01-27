import { useContext } from "react";
import { GameStateContext } from "./contextDef";
import type { GameStateContextValue } from "./contextDef";

export const useGameState = (): GameStateContextValue => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return context;
};
