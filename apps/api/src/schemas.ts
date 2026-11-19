import { z } from "zod";
import { MAX_STAT_VALUE, MIN_STAT_VALUE } from "@grunberg/engine";

const stat = z.number().int().min(MIN_STAT_VALUE).max(MAX_STAT_VALUE);

export const characterSchema = z.object({
  name: z.string().trim().min(1).max(40),
  race: z.enum(["Human", "Elf", "Dwarf"]),
  gender: z.boolean(),
  class: z.enum(["Warrior", "Rogue", "Mage"]),
  stats: z.object({ strength: stat, agility: stat, intelligence: stat }),
});

/**
 * What a client may ask for. These are intents, not state changes:
 * the server turns them into engine actions, so a client can never send e.g. ADD_ITEM or gold.
 */
export const intentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("move"), direction: z.enum(["north", "south", "east", "west"]) }),
  z.object({ type: z.literal("equip"), itemId: z.string().min(1) }),
  z.object({ type: z.literal("unequip"), slot: z.enum(["weapon", "head", "chest", "legs", "feet", "accessory"]) }),
]);

export type Intent = z.infer<typeof intentSchema>;

export const createGameBody = z.object({ character: characterSchema });

export const actionBody = z.object({
  /** Optimistic locking: the version the client last saw. */
  expectedVersion: z.number().int().nonnegative(),
  intent: intentSchema,
});

export const gameParams = z.object({ id: z.uuid() });
