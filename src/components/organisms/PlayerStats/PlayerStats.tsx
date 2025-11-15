import { StatusBar } from "../../molecules/StatusBar";
import { StatGrid } from "../../molecules/StatGrid";
import type { Stat } from "../../molecules/StatGrid";
import { CurrencyDisplay } from "../../molecules/CurrencyDisplay";
import styles from "./PlayerStats.module.css";

export interface PlayerStatsProps {
  hp?: { current: number; max: number };
  mana?: { current: number; max: number };
  exp?: { current: number; max: number };
  stats?: Stat[];
  gold?: number;
}

export const PlayerStats = ({
  hp = { current: 85, max: 100 },
  mana = { current: 60, max: 100 },
  exp = { current: 750, max: 1000 },
  stats = [
    { label: "Siła", value: 12 },
    { label: "Zręczność", value: 15 },
    { label: "Inteligencja", value: 18 },
    { label: "Wytrzymałość", value: 14 },
  ],
  gold = 250,
}: PlayerStatsProps) => {
  return (
    <div className={styles["player-stats"]}>
      <div className={styles["player-stats__section"]}>
        <div className={styles["player-stats__bars"]}>
          <StatusBar
            label="HP"
            current={hp.current}
            max={hp.max}
            color="#e74c3c"
          />
          <StatusBar
            label="Mana"
            current={mana.current}
            max={mana.max}
            color="#3498db"
          />
          <StatusBar
            label="EXP"
            current={exp.current}
            max={exp.max}
            color="#f39c12"
          />
        </div>
      </div>

      <div className={styles["player-stats__section"]}>
        <StatGrid stats={stats} />
      </div>

      <div className={styles["player-stats__section"]}>
        <CurrencyDisplay amount={gold} />
      </div>
    </div>
  );
};
