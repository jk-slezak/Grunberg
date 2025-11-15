import styles from "./StatBadge.module.css";

export interface StatBadgeProps {
  label: string;
  value: number | string;
  color?: string;
}

export const StatBadge = ({ label, value, color = "#6c63ff" }: StatBadgeProps) => {
  return (
    <div className={styles["stat-badge"]}>
      <span className={styles["stat-badge__label"]}>{label}</span>
      <span className={styles["stat-badge__value"]} style={{ color }}>
        {value}
      </span>
    </div>
  );
};


