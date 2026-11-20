import { z } from "zod";
import type { GameStateAction } from "./actions";
import type { GameEvent } from "./events";
import { applyAction, type EngineContext } from "./reducer";
import type { GameState } from "./types/gameState";
import { EQUIPMENT_SLOTS } from "./types/inventory";
import { DIRECTIONS, moveTarget, type MoveRejection } from "./world/movement";

export const MAX_INTENTS_PER_REQUEST = 10;
const MAX_ID_LENGTH = 64;

export const intentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("move"), direction: z.enum(DIRECTIONS) }),
  z.object({ type: z.literal("equip"), itemId: z.string().min(1).max(MAX_ID_LENGTH) }),
  z.object({ type: z.literal("unequip"), slot: z.enum(EQUIPMENT_SLOTS) }),
]);

export type Intent = z.infer<typeof intentSchema>;

export type IntentRejection = "no_character" | MoveRejection | "no_effect";

const toAction = (
  state: GameState,
  intent: Intent,
): { ok: true; action: GameStateAction } | { ok: false; reason: IntentRejection } => {
  if (!state.character) return { ok: false, reason: "no_character" };
  switch (intent.type) {
    case "move": {
      const move = moveTarget(state, intent.direction);
      if (!move.ok) return move;
      return { ok: true, action: { type: "MOVE", payload: { direction: intent.direction } } };
    }
    case "equip":
      return { ok: true, action: { type: "EQUIP_ITEM", payload: { itemId: intent.itemId } } };
    case "unequip":
      return { ok: true, action: { type: "UNEQUIP_ITEM", payload: { slot: intent.slot } } };
  }
};

export interface IntentsResult {
  state: GameState;
  events: GameEvent[];
  rejected?: { index: number; reason: IntentRejection };
}

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
