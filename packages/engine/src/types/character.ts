export const RACES = ["Human", "Elf", "Dwarf"] as const;
export type Race = (typeof RACES)[number];

export interface CharacterStats {
  strength: number;
  agility: number;
  intelligence: number;
}

export const CLASSES = ["Warrior", "Rogue", "Mage"] as const;
export type CharacterClass = (typeof CLASSES)[number];

export interface Character {
  name: string;
  race: Race;
  gender: boolean;
  class: CharacterClass;
  stats: CharacterStats;
}

export const RACE_BASE_STATS: Record<Race, CharacterStats> = {
  Human: {
    strength: 5,
    agility: 5,
    intelligence: 5,
  },
  Elf: {
    strength: 3,
    agility: 7,
    intelligence: 7,
  },
  Dwarf: {
    strength: 8,
    agility: 3,
    intelligence: 4,
  },
};

export const INITIAL_STAT_POINTS = 15;
export const MIN_STAT_VALUE = 1;
export const MAX_STAT_VALUE = 10;

export const MAX_NAME_LENGTH = 20;
const NAME_PATTERN = /^[\p{L}\p{N}]+(?:[ '-][\p{L}\p{N}]+)*$/u;

export const normalizeCharacterName = (name: string): string => name.trim().normalize("NFC");

export const isValidCharacterName = (name: string): boolean => {
  const normalized = normalizeCharacterName(name);
  return normalized.length <= MAX_NAME_LENGTH && NAME_PATTERN.test(normalized);
};

export const sumStats = (stats: CharacterStats): number =>
  stats.strength + stats.agility + stats.intelligence;
