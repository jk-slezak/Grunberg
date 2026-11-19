import { event } from "../events";
import type { InventorySlot, Item } from "../types";
import { unchanged, withInventory, type Handlers } from "./core";

/** Adds items to the backpack, or returns null when the stack or the backpack is full. */
const addToBackpack = (
  slots: InventorySlot[],
  item: Item,
  quantity: number,
  capacity: number,
): InventorySlot[] | null => {
  const existing = item.stackable ? slots.find((s) => s.item.id === item.id) : undefined;
  if (existing) {
    if (existing.quantity + quantity > (item.maxStack ?? Infinity)) return null;
    return slots.map((s) => (s === existing ? { ...s, quantity: s.quantity + quantity } : s));
  }
  if (slots.length >= capacity) return null;
  return [...slots, { item, quantity }];
};

/** Removes items from the backpack, or returns null when the player doesn't have enough. */
const removeFromBackpack = (
  slots: InventorySlot[],
  itemId: string,
  quantity: number,
): InventorySlot[] | null => {
  const slot = slots.find((s) => s.item.id === itemId);
  if (!slot || slot.quantity < quantity) return null;
  return slots
    .map((s) => (s === slot ? { ...s, quantity: s.quantity - quantity } : s))
    .filter((s) => s.quantity > 0);
};

export const inventoryRules = {
  ADD_ITEM: (state, { payload: { item, quantity } }) => {
    if (quantity <= 0) return unchanged(state);
    const items = addToBackpack(state.inventory.items, item, quantity, state.inventory.capacity);
    if (!items) return unchanged(state);
    return {
      state: withInventory(state, { items }),
      events: [event("ITEM_ADDED", { itemId: item.id, quantity })],
    };
  },

  REMOVE_ITEM: (state, { payload: { itemId, quantity } }) => {
    if (quantity <= 0) return unchanged(state);
    const items = removeFromBackpack(state.inventory.items, itemId, quantity);
    if (!items) return unchanged(state);
    return {
      state: withInventory(state, { items }),
      events: [event("ITEM_REMOVED", { itemId, quantity })],
    };
  },

  /** Moves an owned weapon or armor from the backpack to its slot; the previous one goes back. */
  EQUIP_ITEM: (state, { payload: { itemId } }) => {
    const item = state.inventory.items.find((s) => s.item.id === itemId)?.item;
    if (!item || (item.type !== "weapon" && item.type !== "armor")) return unchanged(state);
    if (item.requiredLevel > (state.characterStatus?.level ?? 0)) return unchanged(state);

    const { equipment, capacity } = state.inventory;
    const previous = equipment[item.slot];
    const withoutItem = removeFromBackpack(state.inventory.items, itemId, 1);
    const items =
      withoutItem && previous ? addToBackpack(withoutItem, previous, 1, capacity) : withoutItem;
    if (!items) return unchanged(state);

    return {
      state: withInventory(state, { items, equipment: { ...equipment, [item.slot]: item } }),
      events: [event("ITEM_EQUIPPED", { itemId, slot: item.slot })],
    };
  },

  /** Moves the equipped item back to the backpack, if there is room for it. */
  UNEQUIP_ITEM: (state, { payload: { slot } }) => {
    const { equipment, items, capacity } = state.inventory;
    const current = equipment[slot];
    if (!current) return unchanged(state);
    const newItems = addToBackpack(items, current, 1, capacity);
    if (!newItems) return unchanged(state);

    return {
      state: withInventory(state, { items: newItems, equipment: { ...equipment, [slot]: null } }),
      events: [event("ITEM_UNEQUIPPED", { itemId: current.id, slot })],
    };
  },

  UPDATE_CURRENCY: (state, { payload: { type, amount } }) => {
    const before = state.inventory.currency[type];
    const after = Math.max(0, before + amount);
    if (after === before) return unchanged(state);
    return {
      state: withInventory(state, { currency: { ...state.inventory.currency, [type]: after } }),
      // The amount that actually changed, not the requested one.
      events: [event("CURRENCY_CHANGED", { type, amount: after - before })],
    };
  },
} satisfies Pick<
  Handlers,
  "ADD_ITEM" | "REMOVE_ITEM" | "EQUIP_ITEM" | "UNEQUIP_ITEM" | "UPDATE_CURRENCY"
>;
