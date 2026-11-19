"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createInitialGameState } from "@grunberg/engine";
import { gameEventBus } from "../core/GameEventBus";
import { createGameStore, type GameStore } from "../core/gameStore";

const GameStoreContext = createContext<GameStore | null>(null);

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() =>
    createGameStore({
      initialState: createInitialGameState(),
      emit: (e) => gameEventBus.emit(e.type, e.data as never),
    }),
  );
  return <GameStoreContext.Provider value={store}>{children}</GameStoreContext.Provider>;
};

export const useGameStore = (): GameStore => {
  const store = useContext(GameStoreContext);
  if (!store) throw new Error("Game hooks must be used within a GameStateProvider");
  return store;
};
