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
  | "TILE_EXPLORED"
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
  TILE_EXPLORED: { floor: number; x: number; y: number };
  GAME_SAVED: { timestamp: number };
  GAME_LOADED: { timestamp: number };
  LEVEL_UP: { oldLevel: number; newLevel: number };
  STATUS_EFFECT_APPLIED: { effectId: string; effectName: string };
  STATUS_EFFECT_REMOVED: { effectId: string; effectName: string };
}

type EventCallback<T extends GameEventType> = (data: GameEventData[T]) => void;

class GameEventBus {
  private listeners: Map<GameEventType, Set<EventCallback<GameEventType>>>;
  private static instance: GameEventBus;

  private constructor() {
    this.listeners = new Map();
  }

  public static getInstance(): GameEventBus {
    if (!GameEventBus.instance) {
      GameEventBus.instance = new GameEventBus();
    }
    return GameEventBus.instance;
  }

  public on<T extends GameEventType>(
    eventType: T,
    callback: EventCallback<T>,
  ): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners
      .get(eventType)!
      .add(callback as EventCallback<GameEventType>);
  }

  public off<T extends GameEventType>(
    eventType: T,
    callback: EventCallback<T>,
  ): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback as EventCallback<GameEventType>);
    }
  }

  public emit<T extends GameEventType>(
    eventType: T,
    data: GameEventData[T],
  ): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(data as GameEventData[GameEventType]);
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }

  public removeAllListeners(eventType?: GameEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

export const gameEventBus = GameEventBus.getInstance();
