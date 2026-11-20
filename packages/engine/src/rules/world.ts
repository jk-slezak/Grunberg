import { event, type GameEvent } from "../events";
import { createInitialGameState, type DungeonFloor, type GameState, type Position } from "../types";
import { generateFloor } from "../world/generateFloor";
import { moveTarget, revealAround } from "../world/movement";
import { unchanged, type ActionResult, type Handlers } from "./core";

/** Puts the player on `position` of `floor` and reveals what they can see from there. */
const placePlayer = (
  state: GameState,
  floor: DungeonFloor,
  position: Position,
  events: GameEvent[],
): ActionResult => {
  const { floor: revealedFloor, revealed } = revealAround(floor, position);
  const allEvents = [...events, event("POSITION_CHANGED", position)];
  if (revealed > 0) {
    allEvents.push(event("TILES_REVEALED", { floor: position.floor, count: revealed }));
  }
  return { state: { ...state, currentFloor: revealedFloor, position }, events: allEvents };
};

/** Where the player is and what they have done: position and story flags. */
export const worldRules = {
  MOVE: (state, { payload: { direction } }) => {
    const move = moveTarget(state, direction);
    if (!move.ok || !state.currentFloor) return unchanged(state);
    return placePlayer(state, state.currentFloor, move.target, []);
  },

  ENTER_FLOOR: (state, { payload: { floorNumber, seed } }) => {
    const { floor, spawn } = generateFloor(seed, floorNumber);
    const changed =
      floorNumber !== state.position.floor
        ? [event("FLOOR_CHANGED", { oldFloor: state.position.floor, newFloor: floorNumber })]
        : [];
    return placePlayer(state, floor, spawn, changed);
  },

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
} satisfies Pick<Handlers, "MOVE" | "ENTER_FLOOR" | "UPDATE_POSITION" | "SET_FLAG">;

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
