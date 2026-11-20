import { z } from "zod";
import {
  CLASSES,
  INITIAL_STAT_POINTS,
  intentSchema,
  isValidCharacterName,
  MAX_INTENTS_PER_REQUEST,
  MAX_STAT_VALUE,
  MIN_STAT_VALUE,
  normalizeCharacterName,
  RACES,
  sumStats,
} from "@grunberg/engine";
import { MAX_SNAPSHOT_LENGTH } from "./snapshot";

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

export const createGameBody = z.object({ character: characterSchema });

export const actionBody = z.object({
  expectedVersion: z.number().int().nonnegative().max(MAX_VERSION),
  intents: z.array(intentSchema).min(1).max(MAX_INTENTS_PER_REQUEST),
});

export const restoreGameBody = z.object({
  snapshot: z.string().min(1).max(MAX_SNAPSHOT_LENGTH),
});

export const gameParams = z.object({ id: z.uuid() });
