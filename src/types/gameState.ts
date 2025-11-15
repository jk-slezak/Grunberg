import type { Character, CharacterStats } from "./character";
import type { Inventory } from "./inventory";
import type { QuestProgress } from "./quest";

export interface Position {
  floor: number;
  x: number;
  y: number;
}

export interface CharacterStatus {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  expToNextLevel: number;
  level: number;
  currentStats: CharacterStats;
  statusEffects: StatusEffect[];
}

export interface StatusEffect {
  id: string;
  name: string;
  type: "buff" | "debuff";
  duration: number;
  effect: {
    stat?: keyof CharacterStats;
    value: number;
  };
}

export interface MapTile {
  x: number;
  y: number;
  type: "empty" | "wall" | "door" | "stairs_up" | "stairs_down" | "chest" | "enemy" | "npc";
  explored: boolean;
  visible: boolean;
}

export interface DungeonFloor {
  floorNumber: number;
  tiles: MapTile[][];
  seed: string;
  enemies: string[];
  npcs: string[];
}

export interface GameFlags {
  [key: string]: boolean | number | string;
}

export interface DialogueHistory {
  npcId: string;
  dialogueId: string;
  timestamp: number;
  choicesMade: string[];
}

export interface GameMetadata {
  saveVersion: string;
  lastSaved: number;
  playtime: number;
  createdAt: number;
}

export interface GameState {
  character: Character | null;
  characterStatus: CharacterStatus | null;
  position: Position;
  inventory: Inventory;
  quests: QuestProgress;
  flags: GameFlags;
  currentFloor: DungeonFloor | null;
  exploredFloors: Record<number, DungeonFloor>;
  dialogueHistory: DialogueHistory[];
  metadata: GameMetadata;
}

export const createInitialGameState = (): GameState => ({
  character: null,
  characterStatus: null,
  position: {
    floor: 0,
    x: 0,
    y: 0,
  },
  inventory: {
    items: [],
    equipment: {
      weapon: null,
      head: null,
      chest: null,
      legs: null,
      feet: null,
      accessory: null,
    },
    currency: {
      gold: 0,
      gems: 0,
    },
    capacity: 20,
  },
  quests: {
    activeQuests: [],
    completedQuests: [],
    availableQuests: [],
    failedQuests: [],
  },
  flags: {},
  currentFloor: null,
  exploredFloors: {},
  dialogueHistory: [],
  metadata: {
    saveVersion: "1.0.0",
    lastSaved: Date.now(),
    playtime: 0,
    createdAt: Date.now(),
  },
});

