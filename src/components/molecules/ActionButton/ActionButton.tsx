import styles from "./ActionButton.module.css";

export interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
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
  const handleClick = () => {
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key.toLowerCase() === hotKey.toLowerCase() && !isActive) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <button
      className={`${styles["action-button"]} ${isActive ? styles["action-button--active"] : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`${label} (${hotKey})`}
    >
      <span className={styles["action-button__icon"]}>{icon}</span>
      <span className={styles["action-button__label"]}>{label}</span>
      <span className={styles["action-button__key"]}>{hotKey}</span>
    </button>
  );
};
