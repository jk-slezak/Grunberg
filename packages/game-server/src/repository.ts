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
  get(id: string, activeSince: Date): Promise<StoredGame | null>;
  save(
    id: string,
    expectedVersion: number,
    state: GameState,
    events: GameEvent[],
  ): Promise<StoredGame>;
  events(id: string): Promise<GameEvent[]>;
  deleteInactive(before: Date): Promise<number>;
}

export class InMemoryGameRepository implements GameRepository {
  private games = new Map<string, StoredGame>();
  private log = new Map<string, GameEvent[]>();
  private updatedAt = new Map<string, number>();

  async create(state: GameState, events: GameEvent[]) {
    const game = { id: randomUUID(), state, version: 0 };
    this.games.set(game.id, game);
    this.log.set(game.id, [...events]);
    this.updatedAt.set(game.id, Date.now());
    return game;
  }

  async get(id: string, activeSince: Date) {
    const updatedAt = this.updatedAt.get(id);
    if (updatedAt === undefined || updatedAt < activeSince.getTime()) return null;
    return this.games.get(id) ?? null;
  }

  async save(id: string, expectedVersion: number, state: GameState, events: GameEvent[]) {
    const current = this.games.get(id);
    if (!current || current.version !== expectedVersion) throw new VersionConflict();
    const next = { id, state, version: expectedVersion + 1 };
    this.games.set(id, next);
    this.log.get(id)!.push(...events);
    this.updatedAt.set(id, Date.now());
    return next;
  }

  async events(id: string) {
    return this.log.get(id) ?? [];
  }

  async deleteInactive(before: Date) {
    let deleted = 0;
    for (const [id, updatedAt] of this.updatedAt) {
      if (updatedAt < before.getTime()) {
        this.games.delete(id);
        this.log.delete(id);
        this.updatedAt.delete(id);
        deleted++;
      }
    }
    return deleted;
  }
}
