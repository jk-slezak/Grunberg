import { z } from "zod";
import type { GameStateAction } from "./actions";
import type { GameEvent } from "./events";
import { applyAction, type EngineContext } from "./reducer";
import type { GameState } from "./types/gameState";
import { EQUIPMENT_SLOTS } from "./types/inventory";
import { DIRECTIONS, moveTarget, type MoveRejection } from "./world/movement";

/** Most intents one request may carry. Bounds the work and the events of a single request. */
export const MAX_INTENTS_PER_REQUEST = 10;
const MAX_ID_LENGTH = 64;

/**
 * What a player may ask for. Clients send intents, never state changes or engine actions,
 * so the rules decide what actually happens.
 */
export const intentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("move"), direction: z.enum(DIRECTIONS) }),
  z.object({ type: z.literal("equip"), itemId: z.string().min(1).max(MAX_ID_LENGTH) }),
  z.object({ type: z.literal("unequip"), slot: z.enum(EQUIPMENT_SLOTS) }),
]);

export type Intent = z.infer<typeof intentSchema>;

/** Why an intent was refused. Codes, not sentences: each client words them in its own language. */
export type IntentRejection = "no_character" | MoveRejection | "no_effect";

const toAction = (
  state: GameState,
  intent: Intent,
): { ok: true; action: GameStateAction } | { ok: false; reason: IntentRejection } => {
  if (!state.character) return { ok: false, reason: "no_character" };
  switch (intent.type) {
    case "move": {
      // Checked here as well as in the MOVE rule, to tell the player *why* they can't move.
      const move = moveTarget(state, intent.direction);
      if (!move.ok) return move;
      return { ok: true, action: { type: "MOVE", payload: { direction: intent.direction } } };
    }
    // Ownership, item type and level are checked by the engine (no events -> no_effect).
    case "equip":
      return { ok: true, action: { type: "EQUIP_ITEM", payload: { itemId: intent.itemId } } };
    case "unequip":
      return { ok: true, action: { type: "UNEQUIP_ITEM", payload: { slot: intent.slot } } };
  }
};

export interface IntentsResult {
  state: GameState;
  events: GameEvent[];
  /** The first refused intent. Intents after it are not applied: they assumed it would succeed. */
  rejected?: { index: number; reason: IntentRejection };
}

/**
 * Applies intents in order and stops at the first one the rules refuse. The server runs it to
 * decide, and the browser runs the same code to predict the result before the server answers.
 */
export const applyIntents = (
  state: GameState,
  intents: readonly Intent[],
  ctx: EngineContext,
): IntentsResult => {
  let current = state;
  const events: GameEvent[] = [];
  for (const [index, intent] of intents.entries()) {
    const resolved = toAction(current, intent);
    if (!resolved.ok) {
      return { state: current, events, rejected: { index, reason: resolved.reason } };
    }
    const result = applyAction(current, resolved.action, ctx);
    if (result.events.length === 0) {
      return { state: current, events, rejected: { index, reason: "no_effect" } };
    }
    current = result.state;
    events.push(...result.events);
  }
  return { state: current, events };
};
