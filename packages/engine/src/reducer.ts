import type { GameStateAction } from "./actions";
import type { GameState } from "./types";
import { characterRules } from "./rules/character";
import type { ActionResult, EngineContext, Handler, Handlers } from "./rules/core";
import { inventoryRules } from "./rules/inventory";
import { questRules } from "./rules/quests";
import { sessionRules, worldRules } from "./rules/world";

export type { ActionResult, EngineContext } from "./rules/core";
export { createCharacterStatus } from "./rules/character";

/** Every action type has exactly one handler; the compiler fails if one is missing. */
const handlers: Handlers = {
  ...characterRules,
  ...inventoryRules,
  ...questRules,
  ...worldRules,
  ...sessionRules,
};

/**
 * The single source of truth for game rules. Pure: the same (state, action, ctx) always gives the
 * same result. The browser and the server both run it; the server's result is authoritative.
 */
export const applyAction = (
  state: GameState,
  action: GameStateAction,
  ctx: EngineContext,
): ActionResult => (handlers[action.type] as Handler<typeof action.type>)(state, action, ctx);
