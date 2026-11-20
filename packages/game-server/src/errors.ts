import type { IntentRejection } from "@grunberg/engine";
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

export type RejectionReason = IntentRejection | "length_limit";

const REJECTION_MESSAGES: Record<RejectionReason, string> = {
  no_character: "There is no character in this game",
  no_floor: "There is nowhere to go yet",
  blocked: "You can't go that way",
  no_effect: "Action had no effect",
  length_limit: "This game has reached its length limit",
};

export class IntentRejected extends GameError {
  constructor(readonly reason: RejectionReason) {
    super(REJECTION_MESSAGES[reason]);
  }
}

export class InvalidSnapshot extends GameError {
  constructor() {
    super("Invalid or tampered save");
  }
}

export class RateLimited extends GameError {
  constructor(readonly retryAfterSeconds: number) {
    super("Too many requests");
  }
}
