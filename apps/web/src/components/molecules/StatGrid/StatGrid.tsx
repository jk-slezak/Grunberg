import { StatBadge } from "../../atoms/StatBadge";
import styles from "./StatGrid.module.css";

export interface Stat {
  label: string;
  value: number | string;
  color?: string;
}

export interface StatGridProps {
  stats: Stat[];
}

export const StatGrid = ({ stats }: StatGridProps) => {
  return (
    <div className={styles["stat-grid"]}>
      {stats.map((stat) => (
        <StatBadge
          key={stat.label}
          label={stat.label}
          value={stat.value}
          color={stat.color}
        />
      ))}
    </div>
  );
};


