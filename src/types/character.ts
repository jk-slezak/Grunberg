export type Race = "Human" | "Elf" | "Dwarf" | "Orc";

export interface CharacterStats {
  strength: number;
  agility: number;
  intelligence: number;
}

export interface Character {
  name: string;
  race: Race;
  stats: CharacterStats;
}

export const RACES: Race[] = ["Human", "Elf", "Dwarf", "Orc"];

export const INITIAL_STAT_POINTS = 15;
export const MIN_STAT_VALUE = 1;
export const MAX_STAT_VALUE = 10;
