import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  applyAction,
  createInitialGameState,
  type Character,
  type GameState,
  type Item,
  type WeaponItem,
  type Quest,
} from "../src";

const NOW = 1_700_000_000_000;
const ctx = { now: NOW };

const hero: Character = {
  name: "Aria",
  race: "Elf",
  gender: false,
  class: "Mage",
  stats: { strength: 3, agility: 7, intelligence: 7 },
};

const potion: Item = {
  id: "potion",
  name: "Potion",
  type: "consumable",
  rarity: "common",
  description: "Heals",
  stackable: true,
  maxStack: 10,
  value: 5,
  effect: { type: "heal_hp", value: 50 },
};

const sword = (requiredLevel: number, id = "sword"): WeaponItem => ({
  id,
  name: "Sword",
  type: "weapon",
  rarity: "common",
  description: "",
  stackable: false,
  value: 10,
  damage: 5,
  slot: "weapon",
  requiredLevel,
});

const quest: Quest = {
  id: "tower_floor_1",
  title: "Explore the first floor",
  description: "",
  type: "main",
  status: "available",
  components: [],
  rewards: { exp: 100, gold: 50 },
};

const withHero = (): GameState =>
  applyAction(createInitialGameState(NOW), { type: "CREATE_CHARACTER", payload: hero }, ctx).state;

describe("applyAction", () => {
  it("creates a character with starting status and emits an event", () => {
    const { state, events } = applyAction(
      createInitialGameState(NOW),
      { type: "CREATE_CHARACTER", payload: hero },
      ctx,
    );
    expect(state.character).toEqual(hero);
    expect(state.characterStatus).toMatchObject({ hp: 100, level: 1 });
    expect(events).toEqual([
      { type: "CHARACTER_CREATED", data: { characterName: "Aria", characterClass: "Mage" } },
    ]);
  });

  it("does not mutate the input state", () => {
    const before = withHero();
    const snapshot = structuredClone(before);
    applyAction(before, { type: "ADD_ITEM", payload: { item: potion, quantity: 2 } }, ctx);
    expect(before).toEqual(snapshot);
  });

  it("stacks stackable items and respects maxStack", () => {
    let state = withHero();
    state = applyAction(
      state,
      { type: "ADD_ITEM", payload: { item: potion, quantity: 6 } },
      ctx,
    ).state;
    state = applyAction(
      state,
      { type: "ADD_ITEM", payload: { item: potion, quantity: 4 } },
      ctx,
    ).state;
    expect(state.inventory.items).toEqual([{ item: potion, quantity: 10 }]);

    const overflow = applyAction(
      state,
      { type: "ADD_ITEM", payload: { item: potion, quantity: 1 } },
      ctx,
    );
    expect(overflow.state).toBe(state);
    expect(overflow.events).toEqual([]);
  });

  it("rejects removing more items than the player has", () => {
    const state = applyAction(
      withHero(),
      { type: "ADD_ITEM", payload: { item: potion, quantity: 1 } },
      ctx,
    ).state;
    const result = applyAction(
      state,
      { type: "REMOVE_ITEM", payload: { itemId: "potion", quantity: 2 } },
      ctx,
    );
    expect(result.state).toBe(state);
    expect(result.events).toEqual([]);
  });

  it("reports the actually applied currency change", () => {
    const state = applyAction(
      withHero(),
      { type: "UPDATE_CURRENCY", payload: { type: "gold", amount: 30 } },
      ctx,
    ).state;
    const { state: after, events } = applyAction(
      state,
      { type: "UPDATE_CURRENCY", payload: { type: "gold", amount: -100 } },
      ctx,
    );
    expect(after.inventory.currency.gold).toBe(0);
    expect(events).toEqual([{ type: "CURRENCY_CHANGED", data: { type: "gold", amount: -30 } }]);
  });

  it("cannot start the same quest twice or complete an inactive one", () => {
    let state = applyAction(withHero(), { type: "START_QUEST", payload: quest }, ctx).state;
    expect(applyAction(state, { type: "START_QUEST", payload: quest }, ctx).events).toEqual([]);

    state = applyAction(state, { type: "COMPLETE_QUEST", payload: quest.id }, ctx).state;
    expect(state.quests.completedQuests).toEqual([quest.id]);
    expect(applyAction(state, { type: "COMPLETE_QUEST", payload: quest.id }, ctx).events).toEqual(
      [],
    );
    expect(applyAction(state, { type: "START_QUEST", payload: quest }, ctx).events).toEqual([]);
  });

  it("emits FLOOR_CHANGED only when the floor changes", () => {
    const state = withHero();
    const same = applyAction(
      state,
      { type: "UPDATE_POSITION", payload: { floor: 0, x: 1, y: 0 } },
      ctx,
    );
    const next = applyAction(
      state,
      { type: "UPDATE_POSITION", payload: { floor: 1, x: 0, y: 0 } },
      ctx,
    );
    expect(same.events.map((e) => e.type)).toEqual(["POSITION_CHANGED"]);
    expect(next.events.map((e) => e.type)).toEqual(["POSITION_CHANGED", "FLOOR_CHANGED"]);
  });

  it("uses the injected clock (deterministic)", () => {
    const { events } = applyAction(withHero(), { type: "LOAD_STATE", payload: withHero() }, ctx);
    expect(events).toEqual([{ type: "GAME_LOADED", data: { timestamp: NOW } }]);
  });
});

describe("equipment", () => {
  const withItems = (...items: Item[]) =>
    items.reduce(
      (state, item) =>
        applyAction(state, { type: "ADD_ITEM", payload: { item, quantity: 1 } }, ctx).state,
      withHero(),
    );
  const equip = (state: GameState, itemId: string) =>
    applyAction(state, { type: "EQUIP_ITEM", payload: { itemId } }, ctx);

  it("moves an owned weapon from the backpack to its slot", () => {
    const { state, events } = equip(withItems(sword(1)), "sword");
    expect(state.inventory.equipment.weapon?.id).toBe("sword");
    expect(state.inventory.items).toEqual([]);
    expect(events).toEqual([{ type: "ITEM_EQUIPPED", data: { itemId: "sword", slot: "weapon" } }]);
  });

  it("puts the previously equipped item back in the backpack", () => {
    let state = equip(withItems(sword(1, "old"), sword(1, "new")), "old").state;
    state = equip(state, "new").state;
    expect(state.inventory.equipment.weapon?.id).toBe("new");
    expect(state.inventory.items.map((s) => s.item.id)).toEqual(["old"]);
  });

  it("rejects items the player doesn't own, can't wear, or isn't high enough level for", () => {
    const state = withItems(sword(5, "heavy"), potion);
    expect(equip(state, "missing").events).toEqual([]);
    expect(equip(state, "potion").events).toEqual([]);
    expect(equip(state, "heavy").events).toEqual([]); // level 1 < 5
  });

  it("unequips into the backpack only when there is room", () => {
    const equipped = equip(withItems(sword(1)), "sword").state;
    const { state } = applyAction(
      equipped,
      { type: "UNEQUIP_ITEM", payload: { slot: "weapon" } },
      ctx,
    );
    expect(state.inventory.equipment.weapon).toBeNull();
    expect(state.inventory.items.map((s) => s.item.id)).toEqual(["sword"]);

    const full = { ...equipped, inventory: { ...equipped.inventory, capacity: 0 } };
    expect(
      applyAction(full, { type: "UNEQUIP_ITEM", payload: { slot: "weapon" } }, ctx).events,
    ).toEqual([]);
  });
});

describe("invariants (property-based)", () => {
  it("hp and mp always stay within [0, max] whatever the status update", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record(
            {
              hp: fc.integer({ min: -1000, max: 1000 }),
              mp: fc.integer({ min: -1000, max: 1000 }),
            },
            { requiredKeys: [] },
          ),
          { maxLength: 30 },
        ),
        (updates) => {
          let state = withHero();
          for (const payload of updates) {
            state = applyAction(state, { type: "UPDATE_CHARACTER_STATUS", payload }, ctx).state;
          }
          const s = state.characterStatus!;
          return s.hp >= 0 && s.hp <= s.maxHp && s.mp >= 0 && s.mp <= s.maxMp;
        },
      ),
    );
  });

  it("gold never goes negative", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: -500, max: 500 }), { maxLength: 50 }), (amounts) => {
        let state = withHero();
        for (const amount of amounts) {
          state = applyAction(
            state,
            { type: "UPDATE_CURRENCY", payload: { type: "gold", amount } },
            ctx,
          ).state;
        }
        return state.inventory.currency.gold >= 0;
      }),
    );
  });

  it("inventory never exceeds capacity", () => {
    fc.assert(
      fc.property(fc.array(fc.string({ minLength: 1, maxLength: 4 }), { maxLength: 60 }), (ids) => {
        let state = withHero();
        for (const id of ids) {
          const item: Item = { ...potion, id, stackable: false };
          state = applyAction(
            state,
            { type: "ADD_ITEM", payload: { item, quantity: 1 } },
            ctx,
          ).state;
        }
        return state.inventory.items.length <= state.inventory.capacity;
      }),
    );
  });
});
