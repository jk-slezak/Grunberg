"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useSavedGame } from "../../../hooks/useSavedGame";
import styles from "./MainMenu.module.css";
import menuBgImage from "../../../assets/images/menu_bg.png";

interface MainMenuProps {
  onNewGame: () => void;
  onContinue: () => void;
  onLoadSave: (file: File) => Promise<void>;
}

export const MainMenu = ({ onNewGame, onContinue, onLoadSave }: MainMenuProps) => {
  const { hasSave, savedAt: saveTimestamp } = useSavedGame();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewGameClick = () => {
    if (hasSave) {
      const confirmed = window.confirm(
        "Starting a new game will overwrite your current save. Are you sure you want to continue?",
      );
      if (!confirmed) {
        return;
      }
    }
    onNewGame();
  };

  const handleLoadSaveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      try {
        await onLoadSave(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load save file");
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className={styles.container}>
      <Image
        src={menuBgImage}
        alt=""
        fill
        priority
        sizes="100vw"
        className={styles.backgroundImage}
      />
      <h1 className={styles.title}>Grunberg</h1>
      <p className={styles.subtitle}>Misty Tower Awaits</p>

      <div className={styles.menuButtons}>
        {hasSave ? (
          <>
            <button
              type="button"
              className={`${styles.menuButton} ${styles.secondary}`}
              onClick={onContinue}
            >
              Continue
              {saveTimestamp && (
                <div className={styles.saveInfo}>Last saved: {formatTimestamp(saveTimestamp)}</div>
              )}
            </button>

            <button type="button" className={styles.menuButton} onClick={handleNewGameClick}>
              New Game
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`${styles.menuButton} ${styles.primary}`}
              onClick={handleNewGameClick}
            >
              New Game
            </button>

            <button
              type="button"
              className={styles.menuButton}
              onClick={onContinue}
              disabled={true}
            >
              Continue
            </button>
          </>
        )}

        <button type="button" className={styles.menuButton} onClick={handleLoadSaveClick}>
          Load Save File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};
