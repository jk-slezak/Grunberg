# Game State Structure

Pełna dokumentacja struktury stanu gry w Grunberg.

## Główny interfejs GameState

```typescript
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

## Character (Postać)

Zawiera podstawowe informacje o postaci stworzonej przez gracza.

```typescript
interface Character {
  name: string;
  race: "Human" | "Elf" | "Dwarf";
  gender: boolean; // true = male, false = female
  class: "Warrior" | "Rogue" | "Mage";
  stats: CharacterStats;
}

interface CharacterStats {
  strength: number;
  agility: number;
  intelligence: number;
}
```

**Przykład:**
```typescript
{
  name: "Aragorn",
  race: "Human",
  gender: true,
  class: "Warrior",
  stats: {
    strength: 8,
    agility: 5,
    intelligence: 2
  }
}
```

## CharacterStatus (Status postaci)

Dynamiczne dane zmieniające się w trakcie gry.

```typescript
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

**Przykład:**
```typescript
{
  hp: 85,
  maxHp: 100,
  mp: 30,
  maxMp: 50,
  exp: 450,
  expToNextLevel: 1000,
  level: 3,
  currentStats: {
    strength: 10, // bazowa 8 + 2 z levelu
    agility: 6,
    intelligence: 3
  },
  statusEffects: [
    {
      id: "strength_potion",
      name: "Siła giganta",
      type: "buff",
      duration: 300,
      effect: { stat: "strength", value: 5 }
    }
  ]
}
```

## Position (Pozycja)

Aktualne położenie gracza w dungeonie.

```typescript
interface Position {
  floor: number;
  x: number;
  y: number;
}
```

**Przykład:**
```typescript
{
  floor: 3,
  x: 12,
  y: 8
}
```

## Inventory (Ekwipunek)

Przedmioty, ekwipunek i waluta gracza.

```typescript
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

**Przykład:**
```typescript
{
  items: [
    {
      item: {
        id: "health_potion",
        name: "Mikstura zdrowia",
        type: "consumable",
        rarity: "common",
        description: "Przywraca 50 HP",
        stackable: true,
        maxStack: 99,
        value: 25
      },
      quantity: 5
    },
    {
      item: {
        id: "ancient_key",
        name: "Pradawny klucz",
        type: "quest",
        rarity: "rare",
        description: "Klucz do starożytnych drzwi",
        stackable: false,
        value: 0
      },
      quantity: 1
    }
  ],
  equipment: {
    weapon: {
      id: "iron_sword",
      name: "Żelazny miecz",
      type: "weapon",
      rarity: "common",
      damage: 15,
      slot: "weapon",
      requiredLevel: 1,
      description: "Solidny miecz z żelaza",
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
}
```

## Quests (Questy)

System zadań i ich postępów.

```typescript
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

**Przykład:**
```typescript
{
  activeQuests: [
    {
      id: "tower_floor_1",
      title: "Zbadaj pierwsze piętro Mglistej Wieży",
      description: "Eksploruj pierwsze piętro i pokonaj straż cienia",
      type: "main",
      status: "active",
      components: [
        {
          id: "reach_center",
          type: "reach_location",
          targetId: "floor_1_center",
          count: 1,
          currentProgress: 1,
          description: "Dotrzyj do centrum piętra"
        },
        {
          id: "defeat_guardians",
          type: "defeat_enemy",
          targetId: "shadow_guardian",
          count: 3,
          currentProgress: 2,
          description: "Pokonaj 3 strażników cienia"
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
}
```

## Flags (Flagi gry)

Słownik flag reprezentujących postęp w grze.

```typescript
interface GameFlags {
  [key: string]: boolean | number | string;
}
```

**Przykład:**
```typescript
{
  "tutorial_completed": true,
  "merchant_met": true,
  "tower_entered": true,
  "boss_phase": 2,
  "player_choice_dark_path": false,
  "npc_merchant_friendship": 75,
  "secret_door_found": true,
  "floor_1_boss_defeated": true
}
```

## DungeonFloor (Piętro dungeonu)

Reprezentacja pojedynczego piętra z mapą i zawartością.

```typescript
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

**Przykład:**
```typescript
{
  floorNumber: 1,
  tiles: [
    [
      { x: 0, y: 0, type: "wall", explored: true, visible: true },
      { x: 1, y: 0, type: "wall", explored: true, visible: true },
      // ... więcej tiles
    ],
    [
      { x: 0, y: 1, type: "wall", explored: true, visible: true },
      { x: 1, y: 1, type: "empty", explored: true, visible: true },
      // ... więcej tiles
    ]
  ],
  seed: "floor_1_20231115",
  enemies: ["shadow_guardian_001", "shadow_guardian_002"],
  npcs: ["merchant_floor_1"]
}
```

## DialogueHistory (Historia dialogów)

Historia rozmów z NPC.

```typescript
interface DialogueHistory {
  npcId: string;
  dialogueId: string;
  timestamp: number;
  choicesMade: string[];
}
```

**Przykład:**
```typescript
[
  {
    npcId: "merchant",
    dialogueId: "first_meeting",
    timestamp: 1700000000000,
    choicesMade: ["ask_about_tower", "buy_health_potion"]
  },
  {
    npcId: "mysterious_sage",
    dialogueId: "prophecy_reveal",
    timestamp: 1700001000000,
    choicesMade: ["accept_quest", "thank"]
  }
]
```

## GameMetadata (Metadane)

Informacje techniczne o zapisie gry.

```typescript
interface GameMetadata {
  saveVersion: string;
  lastSaved: number;
  playtime: number;
  createdAt: number;
}
```

**Przykład:**
```typescript
{
  saveVersion: "1.0.0",
  lastSaved: 1700050000000,
  playtime: 7200, // sekundy (2 godziny)
  createdAt: 1700000000000
}
```

## Pełny przykład GameState

```typescript
{
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
          name: "Mikstura zdrowia",
          type: "consumable",
          rarity: "common",
          description: "Przywraca 50 HP",
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
        title: "Pokonaj strażnika piętra 3",
        description: "Zmierz się z potężnym strażnikiem",
        type: "main",
        status: "active",
        components: [
          {
            id: "find_boss",
            type: "reach_location",
            targetId: "boss_room_floor_3",
            count: 1,
            currentProgress: 0,
            description: "Znajdź pokój bossa"
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
    tiles: [], // pełna mapa
    seed: "floor_3_seed",
    enemies: ["boss_guardian"],
    npcs: []
  },
  exploredFloors: {
    1: { /* dane piętra 1 */ },
    2: { /* dane piętra 2 */ }
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
}
```

## Typowe wartości na różnych etapach gry

### Początek gry (po utworzeniu postaci)

```typescript
{
  character: { /* dane z character creator */ },
  characterStatus: {
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    exp: 0,
    expToNextLevel: 100,
    level: 1,
    currentStats: { /* z character creator */ },
    statusEffects: []
  },
  position: { floor: 0, x: 0, y: 0 },
  inventory: {
    items: [],
    equipment: { /* wszystko null */ },
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
}
```

### Mid-game (około 5 godzin gry)

- Level: 10-15
- HP/MP: Znacznie wyższe dzięki levelom
- Inventory: 10-15 przedmiotów, część ekwipunku założona
- Quests: 2-3 aktywne, 10+ ukończone
- Flags: 20-30 różnych flag
- Explored floors: 5-10 pięter
- Playtime: ~18000 sekund (5 godzin)

### End-game

- Level: 30+
- Inventory: Pełny ekwipunek legendarny
- Quests: Główny wątek ukończony, side questy w trakcie
- Flags: 50+ flag reprezentujących całą historię
- Explored floors: 20+ pięter
- Playtime: 50000+ sekund (14+ godzin)

