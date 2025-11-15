import { InfoField } from "../../molecules/InfoField";
import styles from "./GameHeader.module.css";

export interface GameHeaderProps {
  level?: number;
  location?: string;
  title?: string;
}

export const GameHeader = ({ 
  level = 1, 
  location = "Mglisty Portal - Piętro 1",
  title = "Grunberg"
}: GameHeaderProps) => {
  return (
    <div className={styles["game-header"]}>
      <div className={styles["game-header__info"]}>
        <InfoField 
          label="Level" 
          value={level}
          valueColor="#ffd700"
        />
        <div className={styles["game-header__divider"]} />
        <InfoField 
          label="Lokacja" 
          value={location}
        />
      </div>
      <div className={styles["game-header__title"]}>
        <h1>{title}</h1>
      </div>
    </div>
  );
};


