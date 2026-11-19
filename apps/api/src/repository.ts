import { randomUUID } from "node:crypto";
import type { GameEvent, GameState } from "@grunberg/engine";

export interface StoredGame {
  id: string;
  state: GameState;
  version: number;
}

export class VersionConflict extends Error {}

export interface GameRepository {
  create(state: GameState, events: GameEvent[]): Promise<StoredGame>;
  get(id: string): Promise<StoredGame | null>;
  /** Saves only if the stored version still equals expectedVersion; throws VersionConflict otherwise. */
  save(id: string, expectedVersion: number, state: GameState, events: GameEvent[]): Promise<StoredGame>;
  events(id: string): Promise<GameEvent[]>;
}

/** Used in tests and when no DATABASE_URL is configured. */
export class InMemoryGameRepository implements GameRepository {
  private games = new Map<string, StoredGame>();
  private log = new Map<string, GameEvent[]>();

  async create(state: GameState, events: GameEvent[]) {
    const game = { id: randomUUID(), state, version: 0 };
    this.games.set(game.id, game);
    this.log.set(game.id, [...events]);
    return game;
  }

  async get(id: string) {
    return this.games.get(id) ?? null;
  }

  async save(id: string, expectedVersion: number, state: GameState, events: GameEvent[]) {
    const current = this.games.get(id);
    if (!current || current.version !== expectedVersion) throw new VersionConflict();
    const next = { id, state, version: expectedVersion + 1 };
    this.games.set(id, next);
    this.log.get(id)!.push(...events);
    return next;
  }

  async events(id: string) {
    return this.log.get(id) ?? [];
  }
}
