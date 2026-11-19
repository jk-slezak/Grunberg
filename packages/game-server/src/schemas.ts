import { z } from "zod";
import {
  CLASSES,
  INITIAL_STAT_POINTS,
  isValidCharacterName,
  MAX_STAT_VALUE,
  MIN_STAT_VALUE,
  normalizeCharacterName,
  RACES,
  sumStats,
} from "@grunberg/engine";

const EQUIPMENT_SLOTS = ["weapon", "head", "chest", "legs", "feet", "accessory"] as const;
const MAX_ID_LENGTH = 64;
const MAX_VERSION = 1_000_000;

const stat = z.number().int().min(MIN_STAT_VALUE).max(MAX_STAT_VALUE);

export const characterSchema = z.object({
  name: z
    .string()
    .max(100)
    .transform(normalizeCharacterName)
    .refine(isValidCharacterName, "Invalid character name"),
  race: z.enum(RACES),
  gender: z.boolean(),
  class: z.enum(CLASSES),
  stats: z
    .object({ strength: stat, agility: stat, intelligence: stat })
    .refine(
      (s) => sumStats(s) === INITIAL_STAT_POINTS,
      `Stats must add up to ${INITIAL_STAT_POINTS}`,
    ),
});


export const intentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("move"), direction: z.enum(["north", "south", "east", "west"]) }),
  z.object({ type: z.literal("equip"), itemId: z.string().min(1).max(MAX_ID_LENGTH) }),
  z.object({ type: z.literal("unequip"), slot: z.enum(EQUIPMENT_SLOTS) }),
]);

export type Intent = z.infer<typeof intentSchema>;

export const createGameBody = z.object({ character: characterSchema });

export const actionBody = z.object({
  expectedVersion: z.number().int().nonnegative().max(MAX_VERSION),
  intent: intentSchema,
});

export const gameParams = z.object({ id: z.uuid() });
