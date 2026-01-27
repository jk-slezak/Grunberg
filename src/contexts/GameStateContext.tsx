import { useReducer, type ReactNode } from "react";
import type { GameState, CharacterStatus, Position } from "../types/gameState";
import type { Character } from "../types/character";
import type { Item, InventorySlot, WeaponItem, ArmorItem, Equipment } from "../types/inventory";
import type { Quest } from "../types/quest";
import { createInitialGameState } from "../types/gameState";
import { gameEventBus } from "../core/GameEventBus";
import {
  GameStateContext,
  type GameStateAction,
  type GameStateContextValue,
} from "./contextDef";

const gameStateReducer = (state: GameState, action: GameStateAction): GameState => {
  switch (action.type) {
    case "CREATE_CHARACTER": {
      const character = action.payload;
      const characterStatus: CharacterStatus = {
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        exp: 0,
        expToNextLevel: 100,
        level: 1,
        currentStats: character.stats,
        statusEffects: [],
      };

      gameEventBus.emit("CHARACTER_CREATED", {
        characterName: character.name,
        characterClass: character.class,
      });

      return {
        ...state,
        character,
        characterStatus,
      };
    }

    case "UPDATE_CHARACTER_STATUS": {
      if (!state.characterStatus) return state;

      const updates = action.payload;
      gameEventBus.emit("CHARACTER_STATUS_UPDATED", updates);

      return {
        ...state,
        characterStatus: {
          ...state.characterStatus,
          ...updates,
        },
      };
    }

    case "UPDATE_POSITION": {
      const position = action.payload;
      gameEventBus.emit("POSITION_CHANGED", position);

      if (position.floor !== state.position.floor) {
        gameEventBus.emit("FLOOR_CHANGED", {
          oldFloor: state.position.floor,
          newFloor: position.floor,
        });
      }

      return {
        ...state,
        position,
      };
    }

    case "ADD_ITEM": {
      const { item, quantity } = action.payload;
      const existingSlot = state.inventory.items.find((slot) => slot.item.id === item.id);

      let newItems: InventorySlot[];

      if (existingSlot && item.stackable) {
        newItems = state.inventory.items.map((slot) =>
          slot.item.id === item.id
            ? { ...slot, quantity: slot.quantity + quantity }
            : slot
        );
      } else {
        newItems = [...state.inventory.items, { item, quantity }];
      }

      gameEventBus.emit("ITEM_ADDED", { itemId: item.id, quantity });

      return {
        ...state,
        inventory: {
          ...state.inventory,
          items: newItems,
        },
      };
    }

    case "REMOVE_ITEM": {
      const { itemId, quantity } = action.payload;
      const newItems = state.inventory.items
        .map((slot) => {
          if (slot.item.id === itemId) {
            const newQuantity = slot.quantity - quantity;
            return newQuantity > 0 ? { ...slot, quantity: newQuantity } : null;
          }
          return slot;
        })
        .filter((slot): slot is InventorySlot => slot !== null);

      gameEventBus.emit("ITEM_REMOVED", { itemId, quantity });

      return {
        ...state,
        inventory: {
          ...state.inventory,
          items: newItems,
        },
      };
    }

    case "EQUIP_ITEM": {
      const { item } = action.payload;
      if (item.type !== "weapon" && item.type !== "armor") return state;

      let slot: string | null = null;
      if (item.type === "weapon") {
        slot = (item as WeaponItem).slot;
      } else if (item.type === "armor") {
        slot = (item as ArmorItem).slot;
      }

      if (!slot) return state;

      gameEventBus.emit("ITEM_EQUIPPED", { itemId: item.id, slot });

      return {
        ...state,
        inventory: {
          ...state.inventory,
          equipment: {
            ...state.inventory.equipment,
            [slot]: item,
          },
        },
      };
    }

    case "UNEQUIP_ITEM": {
      const { slot } = action.payload;
      const slotKey = slot as keyof Equipment;
      const currentItem = state.inventory.equipment[slotKey];

      if (currentItem) {
        gameEventBus.emit("ITEM_UNEQUIPPED", { itemId: currentItem.id, slot });
      }

      return {
        ...state,
        inventory: {
          ...state.inventory,
          equipment: {
            ...state.inventory.equipment,
            [slotKey]: null,
          },
        },
      };
    }

    case "UPDATE_CURRENCY": {
      const { type, amount } = action.payload;
      const newAmount = state.inventory.currency[type] + amount;

      gameEventBus.emit("CURRENCY_CHANGED", { type, amount });

      return {
        ...state,
        inventory: {
          ...state.inventory,
          currency: {
            ...state.inventory.currency,
            [type]: Math.max(0, newAmount),
          },
        },
      };
    }

    case "START_QUEST": {
      const quest = action.payload;
      gameEventBus.emit("QUEST_STARTED", { questId: quest.id });

      return {
        ...state,
        quests: {
          ...state.quests,
          activeQuests: [...state.quests.activeQuests, { ...quest, status: "active" }],
          availableQuests: state.quests.availableQuests.filter((id) => id !== quest.id),
        },
      };
    }

    case "UPDATE_QUEST": {
      const { questId, updates } = action.payload;
      const newActiveQuests = state.quests.activeQuests.map((quest) =>
        quest.id === questId ? { ...quest, ...updates } : quest
      );

      return {
        ...state,
        quests: {
          ...state.quests,
          activeQuests: newActiveQuests,
        },
      };
    }

    case "COMPLETE_QUEST": {
      const questId = action.payload;
      const quest = state.quests.activeQuests.find((q) => q.id === questId);

      if (quest) {
        gameEventBus.emit("QUEST_COMPLETED", { 
          questId, 
          rewards: { ...quest.rewards } as Record<string, unknown>
        });
      }

      return {
        ...state,
        quests: {
          ...state.quests,
          activeQuests: state.quests.activeQuests.filter((q) => q.id !== questId),
          completedQuests: [...state.quests.completedQuests, questId],
        },
      };
    }

    case "FAIL_QUEST": {
      const questId = action.payload;
      gameEventBus.emit("QUEST_FAILED", { questId });

      return {
        ...state,
        quests: {
          ...state.quests,
          activeQuests: state.quests.activeQuests.filter((q) => q.id !== questId),
          failedQuests: [...state.quests.failedQuests, questId],
        },
      };
    }

    case "SET_FLAG": {
      const { key, value } = action.payload;
      const oldValue = state.flags[key];

      if (oldValue !== undefined) {
        gameEventBus.emit("FLAG_UPDATED", { flagId: key, oldValue, newValue: value });
      } else {
        gameEventBus.emit("FLAG_SET", { flagId: key, value });
      }

      return {
        ...state,
        flags: {
          ...state.flags,
          [key]: value,
        },
      };
    }

    case "LOAD_STATE": {
      gameEventBus.emit("GAME_LOADED", { timestamp: Date.now() });
      return action.payload;
    }

    case "RESET_STATE": {
      return createInitialGameState();
    }

    case "UPDATE_PLAYTIME": {
      return {
        ...state,
        metadata: {
          ...state.metadata,
          playtime: action.payload,
        },
      };
    }

    default:
      return state;
  }
};

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameStateReducer, createInitialGameState());

  const createCharacter = (character: Character) => {
    dispatch({ type: "CREATE_CHARACTER", payload: character });
  };

  const updateCharacterStatus = (updates: Partial<CharacterStatus>) => {
    dispatch({ type: "UPDATE_CHARACTER_STATUS", payload: updates });
  };

  const updatePosition = (position: Position) => {
    dispatch({ type: "UPDATE_POSITION", payload: position });
  };

  const addItem = (item: Item, quantity: number) => {
    dispatch({ type: "ADD_ITEM", payload: { item, quantity } });
  };

  const removeItem = (itemId: string, quantity: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: { itemId, quantity } });
  };

  const equipItem = (item: Item) => {
    dispatch({ type: "EQUIP_ITEM", payload: { item } });
  };

  const unequipItem = (slot: string) => {
    dispatch({ type: "UNEQUIP_ITEM", payload: { slot } });
  };

  const updateCurrency = (type: "gold" | "gems", amount: number) => {
    dispatch({ type: "UPDATE_CURRENCY", payload: { type, amount } });
  };

  const startQuest = (quest: Quest) => {
    dispatch({ type: "START_QUEST", payload: quest });
  };

  const updateQuest = (questId: string, updates: Partial<Quest>) => {
    dispatch({ type: "UPDATE_QUEST", payload: { questId, updates } });
  };

  const completeQuest = (questId: string) => {
    dispatch({ type: "COMPLETE_QUEST", payload: questId });
  };

  const failQuest = (questId: string) => {
    dispatch({ type: "FAIL_QUEST", payload: questId });
  };

  const setFlag = (key: string, value: boolean | number | string) => {
    dispatch({ type: "SET_FLAG", payload: { key, value } });
  };

  const loadState = (newState: GameState) => {
    dispatch({ type: "LOAD_STATE", payload: newState });
  };

  const resetState = () => {
    dispatch({ type: "RESET_STATE" });
  };

  const value: GameStateContextValue = {
    state,
    dispatch,
    createCharacter,
    updateCharacterStatus,
    updatePosition,
    addItem,
    removeItem,
    equipItem,
    unequipItem,
    updateCurrency,
    startQuest,
    updateQuest,
    completeQuest,
    failQuest,
    setFlag,
    loadState,
    resetState,
  };

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
};

