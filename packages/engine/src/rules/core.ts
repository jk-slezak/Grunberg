import type { GameStateAction } from "../actions";
import type { GameEvent } from "../events";
import type { GameState, Inventory, QuestProgress } from "../types";

export interface ActionResult {
  state: GameState;
  /** What happened. Empty when the action was rejected or changed nothing. */
  events: GameEvent[];
}

export interface EngineContext {
  /** Injected clock: keeps the engine deterministic on the server and in tests. */
  now: number;
}

export type ActionType = GameStateAction["type"];
export type ActionOf<T extends ActionType> = Extract<GameStateAction, { type: T }>;
export type Handler<T extends ActionType> = (
  state: GameState,
  action: ActionOf<T>,
  ctx: EngineContext,
) => ActionResult;
export type Handlers = { [T in ActionType]: Handler<T> };

export const unchanged = (state: GameState): ActionResult => ({ state, events: [] });

export const withInventory = (state: GameState, patch: Partial<Inventory>): GameState => ({
  ...state,
  inventory: { ...state.inventory, ...patch },
});

export const withQuests = (state: GameState, patch: Partial<QuestProgress>): GameState => ({
  ...state,
  quests: { ...state.quests, ...patch },
});
