# Game State Structure

Full documentation of the game state structure in Grunberg.

- **Types:** `packages/engine/src/types/` (`gameState.ts`, `character.ts`, `inventory.ts`, `quest.ts`), exported from `@grunberg/engine`.
- **Runtime validation:** `gameStateSchema` (`packages/engine/src/gameStateSchema.ts`) is the Zod version of `GameState`, with size limits (ids up to 64 characters, lists up to 1000 entries, maps up to 256×256, no negative amounts). It validates everything that comes from outside the engine: the localStorage save and imported save files. A compile-time check guarantees that a validated value is a `GameState`.
- **Changes:** state only changes through engine actions (`applyAction`); see [architecture.md](./architecture.md).

## The main GameState interface

```ts
interface GameState {
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
```

## Character

Basic information about the character created by the player.

Rules, enforced by both the character creator and the API (`characterSchema`):

- `race` is one of `RACES` and `class` one of `CLASSES` (`packages/engine/src/types/character.ts`);
- every stat is between `MIN_STAT_VALUE` (1) and `MAX_STAT_VALUE` (10), and they add up to `INITIAL_STAT_POINTS` (15);
- the name is trimmed and NFC-normalized, at most `MAX_NAME_LENGTH` (20) characters: letters and digits in any script, with single spaces, apostrophes or hyphens between words.

```ts
interface Character {
  name: string;
  race: Race; // "Human" | "Elf" | "Dwarf"
  gender: boolean; // true = male, false = female
  class: CharacterClass; // "Warrior" | "Rogue" | "Mage"
  stats: CharacterStats;
}

interface CharacterStats {
  strength: number;
  agility: number;
  intelligence: number;
}
```

**Example:**

```ts
const character: Character = {
  name: "Aragorn",
  race: "Human",
  gender: true,
  class: "Warrior",
  stats: {
    strength: 8,
    agility: 5,
    intelligence: 2
  }
};
```

## CharacterStatus

Dynamic data that changes during the game.

```ts
interface CharacterStatus {
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

interface StatusEffect {
  id: string;
  name: string;
  type: "buff" | "debuff";
  duration: number;
  effect: {
    stat?: keyof CharacterStats;
    value: number;
  };
}
```

**Example:**

```ts
const characterStatus: CharacterStatus = {
  hp: 85,
  maxHp: 100,
  mp: 30,
  maxMp: 50,
  exp: 450,
  expToNextLevel: 1000,
  level: 3,
  currentStats: {
    strength: 10, // base 8 + 2 from levels
    agility: 6,
    intelligence: 3
  },
  statusEffects: [
    {
      id: "strength_potion",
      name: "Giant's Strength",
      type: "buff",
      duration: 300,
      effect: { stat: "strength", value: 5 }
    }
  ]
};
```

## Position

The player's current location in the dungeon.

```ts
interface Position {
  floor: number;
  x: number;
  y: number;
}
```

**Example:**

```ts
const position: Position = {
  floor: 3,
  x: 12,
  y: 8
};
```

## Inventory

The player's items, equipment and currency.

```ts
interface Inventory {
  items: InventorySlot[];
  equipment: Equipment;
  currency: Currency;
  capacity: number;
}

interface InventorySlot {
  item: Item;
  quantity: number;
}

interface Equipment {
  weapon: WeaponItem | null;
  head: ArmorItem | null;
  chest: ArmorItem | null;
  legs: ArmorItem | null;
  feet: ArmorItem | null;
  accessory: ArmorItem | null;
}

interface Currency {
  gold: number;
  gems: number;
}

interface Item {
  id: string;
  name: string;
  type: "weapon" | "armor" | "consumable" | "quest" | "misc";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  description: string;
  stackable: boolean;
  maxStack?: number;
  value: number;
}
```

**Example:**

```ts
const inventory: Inventory = {
  items: [
    {
      item: {
        id: "health_potion",
        name: "Health Potion",
        type: "consumable",
        rarity: "common",
        description: "Restores 50 HP",
        stackable: true,
        maxStack: 99,
        value: 25
      },
      quantity: 5
    },
    {
      item: {
        id: "ancient_key",
        name: "Ancient Key",
        type: "quest",
        rarity: "rare",
        description: "A key to an ancient door",
        stackable: false,
        value: 0
      },
      quantity: 1
    }
  ],
  equipment: {
    weapon: {
      id: "iron_sword",
      name: "Iron Sword",
      type: "weapon",
      rarity: "common",
      damage: 15,
      slot: "weapon",
      requiredLevel: 1,
      description: "A sturdy iron sword",
      stackable: false,
      value: 100
    },
    head: null,
    chest: null,
    legs: null,
    feet: null,
    accessory: null
  },
  currency: {
    gold: 450,
    gems: 12
  },
  capacity: 20
};
```

## Quests

The quest system and quest progress.

```ts
interface QuestProgress {
  activeQuests: Quest[];
  completedQuests: string[];
  availableQuests: string[];
  failedQuests: string[];
}

interface Quest {
  id: string;
  title: string;
  description: string;
  type: "main" | "side" | "exploration" | "daily";
  status: "available" | "active" | "completed" | "failed";
  components: QuestComponent[];
  rewards: QuestRewards;
  nextQuestIds?: string[];
  requirements?: string[];
}

interface QuestComponent {
  id: string;
  type: "defeat_enemy" | "reach_location" | "collect_item" | "talk_to_npc";
  targetId: string;
  count: number;
  currentProgress: number;
  description: string;
}

interface QuestRewards {
  exp: number;
  gold: number;
  items?: string[];
}
```

**Example:**

```ts
const quests: QuestProgress = {
  activeQuests: [
    {
      id: "tower_floor_1",
      title: "Explore the first floor of the Tower of Mist",
      description: "Explore the first floor and defeat the shadow guard",
      type: "main",
      status: "active",
      components: [
        {
          id: "reach_center",
          type: "reach_location",
          targetId: "floor_1_center",
          count: 1,
          currentProgress: 1,
          description: "Reach the center of the floor"
        },
        {
          id: "defeat_guardians",
          type: "defeat_enemy",
          targetId: "shadow_guardian",
          count: 3,
          currentProgress: 2,
          description: "Defeat 3 shadow guardians"
        }
      ],
      rewards: {
        exp: 100,
        gold: 50,
        items: ["ancient_key"]
      },
      nextQuestIds: ["tower_floor_2"]
    }
  ],
  completedQuests: ["tutorial", "first_steps"],
  availableQuests: ["mysterious_merchant"],
  failedQuests: []
};
```

## Flags

A dictionary of flags that represent progress in the game.

```ts
interface GameFlags {
  [key: string]: boolean | number | string;
}
```

**Example:**

```ts
const flags: GameFlags = {
  "tutorial_completed": true,
  "merchant_met": true,
  "tower_entered": true,
  "boss_phase": 2,
  "player_choice_dark_path": false,
  "npc_merchant_friendship": 75,
  "secret_door_found": true,
  "floor_1_boss_defeated": true
};
```

## DungeonFloor

A single floor with its map and contents.

```ts
interface DungeonFloor {
  floorNumber: number;
  tiles: MapTile[][];
  seed: string;
  enemies: string[];
  npcs: string[];
}

interface MapTile {
  x: number;
  y: number;
  type: "empty" | "wall" | "door" | "stairs_up" | "stairs_down" | "chest" | "enemy" | "npc";
  explored: boolean;
  visible: boolean;
}
```

**Example:**

```ts
const floor: DungeonFloor = {
  floorNumber: 1,
  tiles: [
    [
      { x: 0, y: 0, type: "wall", explored: true, visible: true },
      { x: 1, y: 0, type: "wall", explored: true, visible: true },
      // ... more tiles
    ],
    [
      { x: 0, y: 1, type: "wall", explored: true, visible: true },
      { x: 1, y: 1, type: "empty", explored: true, visible: true },
      // ... more tiles
    ]
  ],
  seed: "floor_1_20231115",
  enemies: ["shadow_guardian_001", "shadow_guardian_002"],
  npcs: ["merchant_floor_1"]
};
```

## DialogueHistory

The history of conversations with NPCs.

```ts
interface DialogueHistory {
  npcId: string;
  dialogueId: string;
  timestamp: number;
  choicesMade: string[];
}
```

**Example:**

```ts
const dialogueHistory: DialogueHistory[] = [
  {
    npcId: "merchant",
    dialogueId: "first_meeting",
    timestamp: 1700000000000,
    choicesMade: ["ask_about_tower", "buy_health_potion"],
  },
  {
    npcId: "mysterious_sage",
    dialogueId: "prophecy_reveal",
    timestamp: 1700001000000,
    choicesMade: ["accept_quest", "thank"],
  },
];
```

## GameMetadata

Technical information about the save.

```ts
interface GameMetadata {
  saveVersion: string;
  lastSaved: number;
  playtime: number;
  createdAt: number;
}
```

**Example:**

```ts
const metadata: GameMetadata = {
  saveVersion: "1.0.0",
  lastSaved: 1700050000000,
  playtime: 7200, // seconds (2 hours)
  createdAt: 1700000000000
};
```

## Saves and the server copy

The player's own copy of the game is the local save:

```ts
interface SaveData {
  version: string; // save format version, currently "1.0.0"
  state: GameState;
  timestamp: number; // when it was saved (ms)
}
```

- **Autosave:** `useAutoSave` writes `SaveData` to localStorage shortly after every change (`apps/web/src/services/saveStorage.ts`).
- **Export / import:** a save can be downloaded as a JSON file and loaded again. Imported files are limited to 1 MB and validated with `gameStateSchema` (`apps/web/src/services/saveFile.ts`).
- **Server copy:** games created through the API live in Postgres (`game_sessions.state`) and expire 24 hours after their last change.

## Full GameState example

```ts
const gameState: GameState = {
  character: {
    name: "Aragorn",
    race: "Human",
    gender: true,
    class: "Warrior",
    stats: { strength: 8, agility: 5, intelligence: 2 }
  },
  characterStatus: {
    hp: 85,
    maxHp: 100,
    mp: 30,
    maxMp: 50,
    exp: 450,
    expToNextLevel: 1000,
    level: 3,
    currentStats: { strength: 10, agility: 6, intelligence: 3 },
    statusEffects: []
  },
  position: {
    floor: 3,
    x: 12,
    y: 8
  },
  inventory: {
    items: [
      {
        item: {
          id: "health_potion",
          name: "Health Potion",
          type: "consumable",
          rarity: "common",
          description: "Restores 50 HP",
          stackable: true,
          maxStack: 99,
          value: 25
        },
        quantity: 5
      }
    ],
    equipment: {
      weapon: null,
      head: null,
      chest: null,
      legs: null,
      feet: null,
      accessory: null
    },
    currency: {
      gold: 450,
      gems: 12
    },
    capacity: 20
  },
  quests: {
    activeQuests: [
      {
        id: "tower_floor_3",
        title: "Defeat the guardian of floor 3",
        description: "Face the mighty guardian",
        type: "main",
        status: "active",
        components: [
          {
            id: "find_boss",
            type: "reach_location",
            targetId: "boss_room_floor_3",
            count: 1,
            currentProgress: 0,
            description: "Find the boss room"
          }
        ],
        rewards: {
          exp: 500,
          gold: 200,
          items: ["legendary_sword"]
        }
      }
    ],
    completedQuests: ["tower_floor_1", "tower_floor_2"],
    availableQuests: ["side_quest_merchant"],
    failedQuests: []
  },
  flags: {
    "tutorial_completed": true,
    "floor_3_discovered": true,
    "merchant_friendship": 50
  },
  currentFloor: {
    floorNumber: 3,
    tiles: [], // full map
    seed: "floor_3_seed",
    enemies: ["boss_guardian"],
    npcs: []
  },
  exploredFloors: {
    1: { /* floor 1 data */ },
    2: { /* floor 2 data */ }
  },
  dialogueHistory: [
    {
      npcId: "merchant",
      dialogueId: "greeting",
      timestamp: 1700000000000,
      choicesMade: ["buy_potion"]
    }
  ],
  metadata: {
    saveVersion: "1.0.0",
    lastSaved: 1700050000000,
    playtime: 7200,
    createdAt: 1700000000000
  }
};
```

## Typical values at different stages of the game

### Start of the game (after character creation)

```ts
const newGame: GameState = {
  character: { /* data from the character creator */ },
  characterStatus: {
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    exp: 0,
    expToNextLevel: 100,
    level: 1,
    currentStats: { /* from the character creator */ },
    statusEffects: []
  },
  position: { floor: 0, x: 0, y: 0 },
  inventory: {
    items: [],
    equipment: { /* all null */ },
    currency: { gold: 0, gems: 0 },
    capacity: 20
  },
  quests: {
    activeQuests: [],
    completedQuests: [],
    availableQuests: ["tutorial"],
    failedQuests: []
  },
  flags: {},
  currentFloor: null,
  exploredFloors: {},
  dialogueHistory: [],
  metadata: {
    saveVersion: "1.0.0",
    lastSaved: Date.now(),
    playtime: 0,
    createdAt: Date.now()
  }
};
```

### Mid-game (about 5 hours of play)

- Level: 10-15
- HP/MP: much higher thanks to levels
- Inventory: 10-15 items, some equipment worn
- Quests: 2-3 active, 10+ completed
- Flags: 20-30 different flags
- Explored floors: 5-10 floors
- Playtime: ~18000 seconds (5 hours)

### End-game

- Level: 30+
- Inventory: full legendary equipment
- Quests: main story completed, side quests in progress
- Flags: 50+ flags representing the whole story
- Explored floors: 20+ floors
- Playtime: 50000+ seconds (14+ hours)
