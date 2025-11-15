import styles from "./SkillButton.module.css";

export type SkillButtonProps = {
  name: string;
  icon: React.ReactNode;
  cooldown?: number;
  onClick?: () => void;
  hotKey: string;
  isActive?: boolean;
};

export const SkillButton = ({
  name,
  icon,
  hotKey,
  cooldown = 0,
  onClick,
  isActive = false,
}: SkillButtonProps) => {
  const isOnCooldown = cooldown > 0;

  const handleClick = () => {
    if (!isOnCooldown) {
      onClick?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key.toLowerCase() === hotKey.toLowerCase() && !isOnCooldown) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <button
      className={`${styles["skill-button"]} ${
        isOnCooldown ? styles["skill-button--cooldown"] : ""
      } ${isActive ? styles["skill-button--active"] : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={name}
      tabIndex={0}
      aria-label={`${name} (${hotKey})`}
      disabled={isOnCooldown}
    >
      <span className={styles["skill-button__icon"]}>{icon}</span>
      <span className={styles["skill-button__key"]}>{hotKey}</span>
      {isOnCooldown && (
        <div className={styles["skill-button__cooldown"]}>{cooldown}</div>
      )}
    </button>
  );
};
