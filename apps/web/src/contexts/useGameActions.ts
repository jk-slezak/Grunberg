import { useMemo } from "react";
import type { Character, GameState } from "@grunberg/engine";
import { useGameStore } from "./GameStateContext";

export const useGameActions = () => {
  const { dispatch } = useGameStore();
  return useMemo(
    () => ({
      createCharacter: (character: Character) =>
        dispatch({ type: "CREATE_CHARACTER", payload: character }),
      loadState: (state: GameState) => dispatch({ type: "LOAD_STATE", payload: state }),
      resetState: () => dispatch({ type: "RESET_STATE" }),
    }),
    [dispatch],
  );
};
