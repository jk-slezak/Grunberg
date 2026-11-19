import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  createInitialGameState,
  type Character,
  type CharacterStatus,
  type GameState,
  type Item,
  type Position,
  type Quest,
} from "@grunberg/engine";
import { gameEventBus } from "../core/GameEventBus";
import { createGameStore } from "../core/gameStore";
import { GameStateContext, type GameStateContextValue } from "./contextDef";

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() =>
    createGameStore({
      initialState: createInitialGameState(),
      emit: (e) => gameEventBus.emit(e.type, e.data as never),
    }),
  );
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const { dispatch } = store;

  const createCharacter = (character: Character) => {
    dispatch({ type: "CREATE_CHARACTER", payload: character });
  };

  const updateCharacterStatus = (updates: Partial<CharacterStatus>) => {
    dispatch({ type: "UPDATE_CHARACTER_STATUS", payload: updates });
  };

  const updatePosition = (position: Position) => {
    dispatch({ type: "UPDATE_POSITION", payload: position });
  };

  const addItem = (item: Item, quantity: number) => {
    dispatch({ type: "ADD_ITEM", payload: { item, quantity } });
  };

  const removeItem = (itemId: string, quantity: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: { itemId, quantity } });
  };

  const equipItem = (item: Item) => {
    dispatch({ type: "EQUIP_ITEM", payload: { item } });
  };

  const unequipItem = (slot: string) => {
    dispatch({ type: "UNEQUIP_ITEM", payload: { slot } });
  };

  const updateCurrency = (type: "gold" | "gems", amount: number) => {
    dispatch({ type: "UPDATE_CURRENCY", payload: { type, amount } });
  };

  const startQuest = (quest: Quest) => {
    dispatch({ type: "START_QUEST", payload: quest });
  };

  const updateQuest = (questId: string, updates: Partial<Quest>) => {
    dispatch({ type: "UPDATE_QUEST", payload: { questId, updates } });
  };

  const completeQuest = (questId: string) => {
    dispatch({ type: "COMPLETE_QUEST", payload: questId });
  };

  const failQuest = (questId: string) => {
    dispatch({ type: "FAIL_QUEST", payload: questId });
  };

  const setFlag = (key: string, value: boolean | number | string) => {
    dispatch({ type: "SET_FLAG", payload: { key, value } });
  };

  const loadState = (newState: GameState) => {
    dispatch({ type: "LOAD_STATE", payload: newState });
  };

  const resetState = () => {
    dispatch({ type: "RESET_STATE" });
  };

  const value: GameStateContextValue = {
    state,
    dispatch,
    createCharacter,
    updateCharacterStatus,
    updatePosition,
    addItem,
    removeItem,
    equipItem,
    unequipItem,
    updateCurrency,
    startQuest,
    updateQuest,
    completeQuest,
    failQuest,
    setFlag,
    loadState,
    resetState,
  };

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
};

