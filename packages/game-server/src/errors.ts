import type { StoredGame } from "./repository";

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class GameNotFound extends GameError {
  constructor() {
    super("Game not found");
  }
}

export class StaleVersion extends GameError {
  constructor(readonly current: StoredGame) {
    super("Stale game state");
  }
}

export class IntentRejected extends GameError {}

export class NoEffect extends GameError {
  constructor() {
    super("Action had no effect");
  }
}

export class RateLimited extends GameError {
  constructor(readonly retryAfterSeconds: number) {
    super("Too many requests");
  }
}
