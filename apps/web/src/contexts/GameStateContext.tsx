"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createInitialGameState } from "@grunberg/engine";
import { createGameStore, type GameStore } from "../core/gameStore";

const GameStoreContext = createContext<GameStore | null>(null);

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() =>
    // No subscribers to engine events in the browser yet; pass `emit` once something listens.
    createGameStore({ initialState: createInitialGameState(Date.now()) }),
  );
  return <GameStoreContext.Provider value={store}>{children}</GameStoreContext.Provider>;
};

export const useGameStore = (): GameStore => {
  const store = useContext(GameStoreContext);
  if (!store) throw new Error("Game hooks must be used within a GameStateProvider");
  return store;
};
