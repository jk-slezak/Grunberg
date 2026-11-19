import { describe, expect, it, vi } from "vitest";
import { createInitialGameState, type Character } from "@grunberg/engine";
import { createGameStore } from "./gameStore";

const hero: Character = {
  name: "Aria",
  race: "Elf",
  gender: false,
  class: "Mage",
  stats: { strength: 3, agility: 7, intelligence: 7 },
};

const setup = () => {
  const emit = vi.fn();
  const store = createGameStore({ initialState: createInitialGameState(0), emit, now: () => 0 });
  const listener = vi.fn();
  store.subscribe(listener);
  return { store, emit, listener };
};

describe("createGameStore", () => {
  it("emits events of every action dispatched in a row, in order", () => {
    const { store, emit } = setup();

    store.dispatch({ type: "CREATE_CHARACTER", payload: hero });
    store.dispatch({ type: "UPDATE_CURRENCY", payload: { type: "gold", amount: 10 } });

    expect(emit.mock.calls.map(([e]) => e.type)).toEqual(["CHARACTER_CREATED", "CURRENCY_CHANGED"]);
    expect(store.getState().inventory.currency.gold).toBe(10);
    expect(store.getState().character).toEqual(hero);
  });

  it("does not notify subscribers or emit when an action has no effect", () => {
    const { store, emit, listener } = setup();

    store.dispatch({ type: "REMOVE_ITEM", payload: { itemId: "missing", quantity: 1 } });

    expect(listener).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", () => {
    const { store } = setup();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.dispatch({ type: "CREATE_CHARACTER", payload: hero });

    expect(listener).not.toHaveBeenCalled();
  });
});
