export type Race = "Human" | "Elf" | "Dwarf";

export interface CharacterStats {
  strength: number;
  agility: number;
  intelligence: number;
}

export type CharacterClass = "Warrior" | "Rogue" | "Mage";

export interface Character {
  name: string;
  race: Race;
  gender: boolean;
  class: CharacterClass;
  stats: CharacterStats;
}

export const RACES: Race[] = ["Human", "Elf", "Dwarf"];

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
