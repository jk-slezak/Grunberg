import { useState } from "react";
import {
  INITIAL_STAT_POINTS,
  isValidCharacterName,
  MAX_STAT_VALUE,
  MIN_STAT_VALUE,
  normalizeCharacterName,
  RACE_BASE_STATS,
  sumStats,
  type Character,
  type CharacterClass,
  type CharacterStats,
  type Race,
} from "@grunberg/engine";

export type StatName = keyof CharacterStats;

export const useCharacterForm = () => {
  const [name, setName] = useState("");
  const [race, setRace] = useState<Race>("Human");
  const [gender, setGender] = useState(true);
  const [characterClass, setCharacterClass] = useState<CharacterClass>("Warrior");
  const [stats, setStats] = useState<CharacterStats>(RACE_BASE_STATS.Human);

  const remainingPoints = INITIAL_STAT_POINTS - sumStats(stats);
  const isValid = isValidCharacterName(name) && remainingPoints === 0;

  const canIncrease = (stat: StatName) => stats[stat] < MAX_STAT_VALUE && remainingPoints > 0;
  const canDecrease = (stat: StatName) => stats[stat] > MIN_STAT_VALUE;

  const changeStat = (stat: StatName, delta: 1 | -1) => {
    if (delta > 0 ? !canIncrease(stat) : !canDecrease(stat)) return;
    setStats((current) => ({ ...current, [stat]: current[stat] + delta }));
  };

  const selectRace = (newRace: Race) => {
    setRace(newRace);
    setStats(RACE_BASE_STATS[newRace]);
  };

  const toCharacter = (): Character | null =>
    isValid
      ? { name: normalizeCharacterName(name), race, gender, class: characterClass, stats }
      : null;

  return {
    name,
    setName,
    race,
    selectRace,
    gender,
    setGender,
    characterClass,
    setCharacterClass,
    stats,
    remainingPoints,
    canIncrease,
    canDecrease,
    increaseStat: (stat: StatName) => changeStat(stat, 1),
    decreaseStat: (stat: StatName) => changeStat(stat, -1),
    isValid,
    toCharacter,
  };
};
