import type { Character } from "./types/character";
import type { CharacterStatus, GameState, Position } from "./types/gameState";
import type { Item } from "./types/inventory";
import type { Quest } from "./types/quest";

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
