import styles from "./StatusBar.module.css";

export interface StatusBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
}

export const StatusBar = ({ current, max, color }: StatusBarProps) => {
  const percentage = (current / max) * 100;

  return (
    <div className={styles["status-bar"]}>
      <div className={styles["status-bar__header"]}>
        <span className={styles["status-bar__values"]}>
          {current} / {max}
        </span>
      </div>
      <div className={styles["status-bar__track"]}>
        <div
          className={styles["status-bar__fill"]}
          style={{
            width: `${percentage}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
};


