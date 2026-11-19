import type { ReactNode } from "react";
import styles from "./ActionButton.module.css";

export interface ActionButtonProps {
  label: string;
  icon: ReactNode;
  hotKey: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const ActionButton = ({
  label,
  icon,
  hotKey,
  onClick,
  isActive = false,
}: ActionButtonProps) => {
  return (
    <button
      className={`${styles["action-button"]} ${isActive ? styles["action-button--active"] : ""}`}
      type="button"
      onClick={onClick}
      aria-label={`${label} (${hotKey})`}
    >
      <span className={styles["action-button__icon"]}>{icon}</span>
      <span className={styles["action-button__label"]}>{label}</span>
      <span className={styles["action-button__key"]}>{hotKey}</span>
    </button>
  );
};
