import { createContext } from "react";
import type { GameState, CharacterStatus, Position } from "../types/gameState";
import type { Character } from "../types/character";
import type { Item } from "../types/inventory";
import type { Quest } from "../types/quest";

export type GameStateAction =
  | { type: "CREATE_CHARACTER"; payload: Character }
  | { type: "UPDATE_CHARACTER_STATUS"; payload: Partial<CharacterStatus> }
  | { type: "UPDATE_POSITION"; payload: Position }
  | { type: "ADD_ITEM"; payload: { item: Item; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { itemId: string; quantity: number } }
  | { type: "EQUIP_ITEM"; payload: { item: Item } }
  | { type: "UNEQUIP_ITEM"; payload: { slot: string } }
  | { type: "UPDATE_CURRENCY"; payload: { type: "gold" | "gems"; amount: number } }
  | { type: "START_QUEST"; payload: Quest }
  | { type: "UPDATE_QUEST"; payload: { questId: string; updates: Partial<Quest> } }
  | { type: "COMPLETE_QUEST"; payload: string }
  | { type: "FAIL_QUEST"; payload: string }
  | { type: "SET_FLAG"; payload: { key: string; value: boolean | number | string } }
  | { type: "LOAD_STATE"; payload: GameState }
  | { type: "RESET_STATE" }
  | { type: "UPDATE_PLAYTIME"; payload: number };

export interface GameStateContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameStateAction>;
  createCharacter: (character: Character) => void;
  updateCharacterStatus: (updates: Partial<CharacterStatus>) => void;
  updatePosition: (position: Position) => void;
  addItem: (item: Item, quantity: number) => void;
  removeItem: (itemId: string, quantity: number) => void;
  equipItem: (item: Item) => void;
  unequipItem: (slot: string) => void;
  updateCurrency: (type: "gold" | "gems", amount: number) => void;
  startQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  completeQuest: (questId: string) => void;
  failQuest: (questId: string) => void;
  setFlag: (key: string, value: boolean | number | string) => void;
  loadState: (state: GameState) => void;
  resetState: () => void;
}

export const GameStateContext = createContext<GameStateContextValue | undefined>(undefined);
