import { z } from "zod";
import { CLASSES, MAX_NAME_LENGTH, RACES } from "./types/character";
import type { GameState } from "./types/gameState";

const id = z.string().min(1).max(64);
const text = z.string().max(1000);
const count = z.number().int().min(0).max(1_000_000);
const MAX_LIST = 1000;
const MAX_MAP_SIZE = 256;

const stats = z.object({ strength: count, agility: count, intelligence: count });

const itemBase = {
  id,
  name: z.string().max(100),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]),
  description: text,
  stackable: z.boolean(),
  maxStack: count.optional(),
  value: count,
};
const weapon = z.object({
  ...itemBase,
  type: z.literal("weapon"),
  damage: count,
  slot: z.literal("weapon"),
  requiredLevel: count,
});
const armor = z.object({
  ...itemBase,
  type: z.literal("armor"),
  defense: count,
  slot: z.enum(["head", "chest", "legs", "feet", "accessory"]),
  requiredLevel: count,
});
const consumable = z.object({
  ...itemBase,
  type: z.literal("consumable"),
  effect: z.object({
    type: z.enum(["heal_hp", "heal_mp", "buff_stat"]),
    value: z.number(),
    duration: count.optional(),
  }),
});
const otherItem = z.object({ ...itemBase, type: z.enum(["quest", "misc"]) });
const item = z.union([weapon, armor, consumable, otherItem]);

const questComponent = z.object({
  id,
  type: z.enum(["defeat_enemy", "reach_location", "collect_item", "talk_to_npc"]),
  targetId: id,
  count,
  currentProgress: count,
  description: text,
  enemyType: id.optional(),
  floor: count.optional(),
  locationId: id.optional(),
  itemId: id.optional(),
  npcId: id.optional(),
});
const quest = z.object({
  id,
  title: z.string().max(200),
  description: text,
  type: z.enum(["main", "side", "exploration", "daily"]),
  status: z.enum(["available", "active", "completed", "failed"]),
  components: z.array(questComponent).max(50),
  rewards: z.object({ exp: count, gold: count, items: z.array(id).max(50).optional() }),
  nextQuestIds: z.array(id).max(50).optional(),
  requirements: z.array(id).max(50).optional(),
});

const tile = z.object({
  x: count,
  y: count,
  type: z.enum(["empty", "wall", "door", "stairs_up", "stairs_down", "chest", "enemy", "npc"]),
  explored: z.boolean(),
  visible: z.boolean(),
});
const floor = z.object({
  floorNumber: count,
  tiles: z.array(z.array(tile).max(MAX_MAP_SIZE)).max(MAX_MAP_SIZE),
  seed: z.string().max(100),
  enemies: z.array(id).max(MAX_LIST),
  npcs: z.array(id).max(MAX_LIST),
});

export const gameStateSchema = z.object({
  character: z
    .object({
      name: z.string().min(1).max(MAX_NAME_LENGTH),
      race: z.enum(RACES),
      gender: z.boolean(),
      class: z.enum(CLASSES),
      stats,
    })
    .nullable(),
  characterStatus: z
    .object({
      hp: count,
      maxHp: count,
      mp: count,
      maxMp: count,
      exp: count,
      expToNextLevel: count,
      level: count,
      currentStats: stats,
      statusEffects: z
        .array(
          z.object({
            id,
            name: z.string().max(100),
            type: z.enum(["buff", "debuff"]),
            duration: count,
            effect: z.object({
              stat: z.enum(["strength", "agility", "intelligence"]).optional(),
              value: z.number(),
            }),
          }),
        )
        .max(50),
    })
    .nullable(),
  position: z.object({ floor: count, x: count, y: count }),
  inventory: z.object({
    items: z.array(z.object({ item, quantity: count })).max(MAX_LIST),
    equipment: z.object({
      weapon: weapon.nullable(),
      head: armor.nullable(),
      chest: armor.nullable(),
      legs: armor.nullable(),
      feet: armor.nullable(),
      accessory: armor.nullable(),
    }),
    currency: z.object({ gold: count, gems: count }),
    capacity: count,
  }),
  quests: z.object({
    activeQuests: z.array(quest).max(MAX_LIST),
    completedQuests: z.array(id).max(MAX_LIST),
    availableQuests: z.array(id).max(MAX_LIST),
    failedQuests: z.array(id).max(MAX_LIST),
  }),
  flags: z.record(z.string().max(64), z.union([z.boolean(), z.number(), z.string().max(200)])),
  currentFloor: floor.nullable(),
  exploredFloors: z.record(z.string().regex(/^\d{1,4}$/), floor),
  dialogueHistory: z
    .array(
      z.object({
        npcId: id,
        dialogueId: id,
        timestamp: z.number(),
        choicesMade: z.array(id).max(100),
      }),
    )
    .max(MAX_LIST),
  metadata: z.object({
    saveVersion: z.string().max(20),
    lastSaved: z.number(),
    playtime: z.number().min(0),
    createdAt: z.number(),
  }),
});

type Validated = z.infer<typeof gameStateSchema>;
const _assignable = (value: Validated): GameState => value;
void _assignable;
