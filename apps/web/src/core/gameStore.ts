import {
  applyAction,
  type GameEvent,
  type GameState,
  type GameStateAction,
} from "@grunberg/engine";

export interface GameStore {
  getState: () => GameState;
  dispatch: (action: GameStateAction) => void;
  subscribe: (listener: () => void) => () => void;
}

interface GameStoreOptions {
  initialState: GameState;
  emit?: (event: GameEvent) => void;
  now?: () => number;
}

export const createGameStore = ({
  initialState,
  emit = () => {},
  now = Date.now,
}: GameStoreOptions): GameStore => {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,

    dispatch: (action) => {
      const result = applyAction(state, action, { now: now() });
      if (result.state !== state) {
        state = result.state;
        listeners.forEach((listener) => listener());
      }
      result.events.forEach(emit);
    },

    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
