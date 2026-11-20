export type GameEventType =
  | "CHARACTER_CREATED"
  | "CHARACTER_STATUS_UPDATED"
  | "POSITION_CHANGED"
  | "ITEM_ADDED"
  | "ITEM_REMOVED"
  | "ITEM_EQUIPPED"
  | "ITEM_UNEQUIPPED"
  | "CURRENCY_CHANGED"
  | "QUEST_STARTED"
  | "QUEST_COMPLETED"
  | "QUEST_FAILED"
  | "QUEST_PROGRESS_UPDATED"
  | "ENEMY_DEFEATED"
  | "LOCATION_REACHED"
  | "NPC_TALKED"
  | "DIALOGUE_STARTED"
  | "DIALOGUE_CHOICE_MADE"
  | "DIALOGUE_ENDED"
  | "FLAG_SET"
  | "FLAG_UPDATED"
  | "FLOOR_CHANGED"
  | "TILES_REVEALED"
  | "GAME_SAVED"
  | "GAME_LOADED"
  | "LEVEL_UP"
  | "STATUS_EFFECT_APPLIED"
  | "STATUS_EFFECT_REMOVED";

export interface GameEventData {
  CHARACTER_CREATED: { characterName: string; characterClass: string };
  CHARACTER_STATUS_UPDATED: { hp?: number; mp?: number; exp?: number };
  POSITION_CHANGED: { floor: number; x: number; y: number };
  ITEM_ADDED: { itemId: string; quantity: number };
  ITEM_REMOVED: { itemId: string; quantity: number };
  ITEM_EQUIPPED: { itemId: string; slot: string };
  ITEM_UNEQUIPPED: { itemId: string; slot: string };
  CURRENCY_CHANGED: { type: "gold" | "gems"; amount: number };
  QUEST_STARTED: { questId: string };
  QUEST_COMPLETED: { questId: string; rewards: Record<string, unknown> };
  QUEST_FAILED: { questId: string };
  QUEST_PROGRESS_UPDATED: {
    questId: string;
    componentId: string;
    progress: number;
  };
  ENEMY_DEFEATED: {
    enemyType: string;
    enemyId: string;
    location: { floor: number; x: number; y: number };
  };
  LOCATION_REACHED: { locationId: string; floor: number; x: number; y: number };
  NPC_TALKED: { npcId: string };
  DIALOGUE_STARTED: { npcId: string; dialogueId: string };
  DIALOGUE_CHOICE_MADE: { dialogueId: string; choiceId: string };
  DIALOGUE_ENDED: { npcId: string; dialogueId: string };
  FLAG_SET: { flagId: string; value: boolean | number | string };
  FLAG_UPDATED: { flagId: string; oldValue: unknown; newValue: unknown };
  FLOOR_CHANGED: { oldFloor: number; newFloor: number };
  TILES_REVEALED: { floor: number; count: number };
  GAME_SAVED: { timestamp: number };
  GAME_LOADED: { timestamp: number };
  LEVEL_UP: { oldLevel: number; newLevel: number };
  STATUS_EFFECT_APPLIED: { effectId: string; effectName: string };
  STATUS_EFFECT_REMOVED: { effectId: string; effectName: string };
}

export type GameEvent = {
  [K in GameEventType]: { type: K; data: GameEventData[K] };
}[GameEventType];

export const event = <T extends GameEventType>(type: T, data: GameEventData[T]): GameEvent =>
  ({ type, data }) as GameEvent;
