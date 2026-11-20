import type { GameState, Position } from "@grunberg/engine";
import type { PlayerStatsProps } from "../components/organisms/PlayerStats";

export const toPlayerStats = (state: GameState): PlayerStatsProps | null => {
  const status = state.characterStatus;
  if (!status) return null;
  return {
    hp: { current: status.hp, max: status.maxHp },
    mana: { current: status.mp, max: status.maxMp },
    exp: { current: status.exp, max: status.expToNextLevel },
    stats: [
      { label: "Siła", value: status.currentStats.strength },
      { label: "Zręczność", value: status.currentStats.agility },
      { label: "Inteligencja", value: status.currentStats.intelligence },
    ],
    gold: state.inventory.currency.gold,
  };
};

export const locationName = (position: Position): string =>
  `Mglista Wieża – piętro ${position.floor}`;
