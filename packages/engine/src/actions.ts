import type { Character } from "./types/character";
import type { CharacterStatus, GameState, Position } from "./types/gameState";
import type { EquipmentSlot, Item } from "./types/inventory";
import type { Quest } from "./types/quest";
import type { Direction } from "./world/movement";

export type GameStateAction =
  | { type: "CREATE_CHARACTER"; payload: Character }
  | { type: "UPDATE_CHARACTER_STATUS"; payload: Partial<CharacterStatus> }
  | { type: "UPDATE_POSITION"; payload: Position }
  | { type: "MOVE"; payload: { direction: Direction } }
  | { type: "ENTER_FLOOR"; payload: { floorNumber: number; seed: string } }
  | { type: "ADD_ITEM"; payload: { item: Item; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { itemId: string; quantity: number } }
  | { type: "EQUIP_ITEM"; payload: { itemId: string } }
  | { type: "UNEQUIP_ITEM"; payload: { slot: EquipmentSlot } }
  | { type: "UPDATE_CURRENCY"; payload: { type: "gold" | "gems"; amount: number } }
  | { type: "START_QUEST"; payload: Quest }
  | { type: "UPDATE_QUEST"; payload: { questId: string; updates: Partial<Quest> } }
  | { type: "COMPLETE_QUEST"; payload: string }
  | { type: "FAIL_QUEST"; payload: string }
  | { type: "SET_FLAG"; payload: { key: string; value: boolean | number | string } }
  | { type: "LOAD_STATE"; payload: GameState }
  | { type: "RESET_STATE" }
  | { type: "UPDATE_PLAYTIME"; payload: number };
