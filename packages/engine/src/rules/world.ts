import { event, type GameEvent } from "../events";
import { createInitialGameState } from "../types";
import { unchanged, type Handlers } from "./core";

/** Where the player is and what they have done: position and story flags. */
export const worldRules = {
  UPDATE_POSITION: (state, { payload: position }) => {
    const events: GameEvent[] = [event("POSITION_CHANGED", position)];
    if (position.floor !== state.position.floor) {
      events.push(
        event("FLOOR_CHANGED", { oldFloor: state.position.floor, newFloor: position.floor }),
      );
    }
    return { state: { ...state, position }, events };
  },

  SET_FLAG: (state, { payload: { key, value } }) => {
    const oldValue = state.flags[key];
    if (oldValue === value) return unchanged(state);
    return {
      state: { ...state, flags: { ...state.flags, [key]: value } },
      events: [
        oldValue !== undefined
          ? event("FLAG_UPDATED", { flagId: key, oldValue, newValue: value })
          : event("FLAG_SET", { flagId: key, value }),
      ],
    };
  },
} satisfies Pick<Handlers, "UPDATE_POSITION" | "SET_FLAG">;

/** Whole-session operations: loading, resetting and tracking playtime. */
export const sessionRules = {
  LOAD_STATE: (_state, { payload }, ctx) => ({
    state: payload,
    events: [event("GAME_LOADED", { timestamp: ctx.now })],
  }),

  RESET_STATE: (_state, _action, ctx) => ({ state: createInitialGameState(ctx.now), events: [] }),

  UPDATE_PLAYTIME: (state, { payload: playtime }) => ({
    state: { ...state, metadata: { ...state.metadata, playtime } },
    events: [],
  }),
} satisfies Pick<Handlers, "LOAD_STATE" | "RESET_STATE" | "UPDATE_PLAYTIME">;
