import type { GameStateAction } from "./actions";
import { event, type GameEvent } from "./events";
import { createInitialGameState, type CharacterStatus, type GameState } from "./types/gameState";
import type { Equipment, InventorySlot } from "./types/inventory";

export interface ActionResult {
  state: GameState;
  /** Events describing what happened. Empty when the action was rejected or had no effect. */
  events: GameEvent[];
}

export interface EngineContext {
  /** Injected clock, so the engine stays deterministic in tests and on the server. */
  now: number;
}

const unchanged = (state: GameState): ActionResult => ({ state, events: [] });

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const createCharacterStatus = (
  stats: CharacterStatus["currentStats"],
): CharacterStatus => ({
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  exp: 0,
  expToNextLevel: 100,
  level: 1,
  currentStats: stats,
  statusEffects: [],
});

/**
 * The single source of truth for game rules.
 * Pure function: same (state, action, ctx) always gives the same result.
 * The client and the server both run it; the server's result is authoritative.
 */
export const applyAction = (
  state: GameState,
  action: GameStateAction,
  ctx: EngineContext = { now: Date.now() },
): ActionResult => {
  switch (action.type) {
    case "CREATE_CHARACTER": {
      const character = action.payload;
      return {
        state: {
          ...state,
          character,
          characterStatus: createCharacterStatus(character.stats),
        },
        events: [
          event("CHARACTER_CREATED", {
            characterName: character.name,
            characterClass: character.class,
          }),
        ],
      };
    }

    case "UPDATE_CHARACTER_STATUS": {
      const current = state.characterStatus;
      if (!current) return unchanged(state);

      const next: CharacterStatus = { ...current, ...action.payload };
      next.maxHp = Math.max(1, next.maxHp);
      next.maxMp = Math.max(0, next.maxMp);
      next.hp = clamp(next.hp, 0, next.maxHp);
      next.mp = clamp(next.mp, 0, next.maxMp);
      next.exp = Math.max(0, next.exp);

      return {
        state: { ...state, characterStatus: next },
        events: [
          event("CHARACTER_STATUS_UPDATED", { hp: next.hp, mp: next.mp, exp: next.exp }),
        ],
      };
    }

    case "UPDATE_POSITION": {
      const position = action.payload;
      const events: GameEvent[] = [event("POSITION_CHANGED", position)];
      if (position.floor !== state.position.floor) {
        events.push(
          event("FLOOR_CHANGED", { oldFloor: state.position.floor, newFloor: position.floor }),
        );
      }
      return { state: { ...state, position }, events };
    }

    case "ADD_ITEM": {
      const { item, quantity } = action.payload;
      if (quantity <= 0) return unchanged(state);

      const { items, capacity } = state.inventory;
      const existing = items.find((slot) => slot.item.id === item.id);
      let newItems: InventorySlot[];

      if (existing && item.stackable) {
        const maxStack = item.maxStack ?? Infinity;
        if (existing.quantity + quantity > maxStack) return unchanged(state);
        newItems = items.map((slot) =>
          slot === existing ? { ...slot, quantity: slot.quantity + quantity } : slot,
        );
      } else {
        if (items.length >= capacity) return unchanged(state);
        newItems = [...items, { item, quantity }];
      }

      return {
        state: { ...state, inventory: { ...state.inventory, items: newItems } },
        events: [event("ITEM_ADDED", { itemId: item.id, quantity })],
      };
    }

    case "REMOVE_ITEM": {
      const { itemId, quantity } = action.payload;
      const slot = state.inventory.items.find((s) => s.item.id === itemId);
      if (!slot || quantity <= 0 || slot.quantity < quantity) return unchanged(state);

      const newItems = state.inventory.items
        .map((s) => (s === slot ? { ...s, quantity: s.quantity - quantity } : s))
        .filter((s) => s.quantity > 0);

      return {
        state: { ...state, inventory: { ...state.inventory, items: newItems } },
        events: [event("ITEM_REMOVED", { itemId, quantity })],
      };
    }

    case "EQUIP_ITEM": {
      const { item } = action.payload;
      if (item.type !== "weapon" && item.type !== "armor") return unchanged(state);

      const slot = (item as { slot?: keyof Equipment }).slot;
      if (!slot) return unchanged(state);

      return {
        state: {
          ...state,
          inventory: {
            ...state.inventory,
            equipment: { ...state.inventory.equipment, [slot]: item },
          },
        },
        events: [event("ITEM_EQUIPPED", { itemId: item.id, slot })],
      };
    }

    case "UNEQUIP_ITEM": {
      const slot = action.payload.slot as keyof Equipment;
      const current = state.inventory.equipment[slot];
      if (!current) return unchanged(state);

      return {
        state: {
          ...state,
          inventory: {
            ...state.inventory,
            equipment: { ...state.inventory.equipment, [slot]: null },
          },
        },
        events: [event("ITEM_UNEQUIPPED", { itemId: current.id, slot })],
      };
    }

    case "UPDATE_CURRENCY": {
      const { type, amount } = action.payload;
      const before = state.inventory.currency[type];
      const after = Math.max(0, before + amount);
      if (after === before) return unchanged(state);

      return {
        state: {
          ...state,
          inventory: {
            ...state.inventory,
            currency: { ...state.inventory.currency, [type]: after },
          },
        },
        // Report the amount that actually changed, not the requested one.
        events: [event("CURRENCY_CHANGED", { type, amount: after - before })],
      };
    }

    case "START_QUEST": {
      const quest = action.payload;
      const { activeQuests, completedQuests } = state.quests;
      if (
        activeQuests.some((q) => q.id === quest.id) ||
        completedQuests.includes(quest.id)
      ) {
        return unchanged(state);
      }

      return {
        state: {
          ...state,
          quests: {
            ...state.quests,
            activeQuests: [...activeQuests, { ...quest, status: "active" }],
            availableQuests: state.quests.availableQuests.filter((id) => id !== quest.id),
          },
        },
        events: [event("QUEST_STARTED", { questId: quest.id })],
      };
    }

    case "UPDATE_QUEST": {
      const { questId, updates } = action.payload;
      if (!state.quests.activeQuests.some((q) => q.id === questId)) return unchanged(state);

      return {
        state: {
          ...state,
          quests: {
            ...state.quests,
            activeQuests: state.quests.activeQuests.map((q) =>
              q.id === questId ? { ...q, ...updates } : q,
            ),
          },
        },
        events: [],
      };
    }

    case "COMPLETE_QUEST": {
      const questId = action.payload;
      const quest = state.quests.activeQuests.find((q) => q.id === questId);
      if (!quest) return unchanged(state);

      return {
        state: {
          ...state,
          quests: {
            ...state.quests,
            activeQuests: state.quests.activeQuests.filter((q) => q.id !== questId),
            completedQuests: [...state.quests.completedQuests, questId],
          },
        },
        events: [event("QUEST_COMPLETED", { questId, rewards: { ...quest.rewards } })],
      };
    }

    case "FAIL_QUEST": {
      const questId = action.payload;
      if (!state.quests.activeQuests.some((q) => q.id === questId)) return unchanged(state);

      return {
        state: {
          ...state,
          quests: {
            ...state.quests,
            activeQuests: state.quests.activeQuests.filter((q) => q.id !== questId),
            failedQuests: [...state.quests.failedQuests, questId],
          },
        },
        events: [event("QUEST_FAILED", { questId })],
      };
    }

    case "SET_FLAG": {
      const { key, value } = action.payload;
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
    }

    case "LOAD_STATE":
      return {
        state: action.payload,
        events: [event("GAME_LOADED", { timestamp: ctx.now })],
      };

    case "RESET_STATE":
      return { state: createInitialGameState(ctx.now), events: [] };

    case "UPDATE_PLAYTIME":
      return {
        state: { ...state, metadata: { ...state.metadata, playtime: action.payload } },
        events: [],
      };

    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
};
