import { createContext } from "react";
import type {
  Character,
  CharacterStatus,
  GameState,
  GameStateAction,
  Item,
  Position,
  Quest,
} from "@grunberg/engine";

export type { GameStateAction };

export interface GameStateContextValue {
  state: GameState;
  dispatch: (action: GameStateAction) => void;
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
