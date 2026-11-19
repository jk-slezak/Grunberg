import type { GameEventData, GameEventType } from "@grunberg/engine";

export type { GameEventData, GameEventType };

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

  public on<T extends GameEventType>(eventType: T, callback: EventCallback<T>): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback<GameEventType>);
  }

  public off<T extends GameEventType>(eventType: T, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback as EventCallback<GameEventType>);
    }
  }

  public emit<T extends GameEventType>(eventType: T, data: GameEventData[T]): void {
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
