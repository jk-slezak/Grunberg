import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { GameState, CharacterStatus, Position } from "../types/gameState";
import type { Character } from "../types/character";
import type { Item, InventorySlot, WeaponItem, ArmorItem } from "../types/inventory";
import type { Quest } from "../types/quest";
import { createInitialGameState } from "../types/gameState";
import { gameEventBus } from "../core/GameEventBus";

type GameStateAction =
  | { type: "CREATE_CHARACTER"; payload: Character }
  | { type: "UPDATE_CHARACTER_STATUS"; payload: Partial<CharacterStatus> }
  | { type: "UPDATE_POSITION"; payload: Position }
  | { type: "ADD_ITEM"; payload: { item: Item; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { itemId: string; quantity: number } }
  | { type: "EQUIP_ITEM"; payload: { item: Item } }
  | { type: "UNEQUIP_ITEM"; payload: { slot: string } }
  | { type: "UPDATE_CURRENCY"; payload: { type: "gold" | "gems"; amount: number } }
  | { type: "START_QUEST"; payload: Quest }
  | { type: "UPDATE_QUEST"; payload: { questId: string; updates: Partial<Quest> } }
  | { type: "COMPLETE_QUEST"; payload: string }
  | { type: "FAIL_QUEST"; payload: string }
  | { type: "SET_FLAG"; payload: { key: string; value: boolean | number | string } }
  | { type: "LOAD_STATE"; payload: GameState }
  | { type: "RESET_STATE" }
  | { type: "UPDATE_PLAYTIME"; payload: number };

interface GameStateContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameStateAction>;
  createCharacter: (character: Character) => void;
  updateCharacterStatus: (updates: Partial<CharacterStatus>) => void;
  updatePosition: (position: Position) => void;
  addItem: (item: Item, quantity: number) => void;
  removeItem: (itemId: string, quantity: number) => void;
  equipItem: (item: Item) => void;
  unequipItem: (slot: string) => void;
  updateCurrency: (type: "gold" | "gems", amount: number) => void;
  startQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  completeQuest: (questId: string) => void;
  failQuest: (questId: string) => void;
  setFlag: (key: string, value: boolean | number | string) => void;
  loadState: (state: GameState) => void;
  resetState: () => void;
}

const GameStateContext = createContext<GameStateContextValue | undefined>(undefined);

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
      const currentItem = state.inventory.equipment[slot as keyof typeof state.inventory.equipment];

      if (currentItem) {
        gameEventBus.emit("ITEM_UNEQUIPPED", { itemId: currentItem.id, slot });
      }

      return {
        ...state,
        inventory: {
          ...state.inventory,
          equipment: {
            ...state.inventory.equipment,
            [slot]: null,
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

export const useGameState = (): GameStateContextValue => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return context;
};

