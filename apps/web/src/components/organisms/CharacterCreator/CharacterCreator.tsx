import type { FormEvent } from "react";
import { CLASSES, MAX_NAME_LENGTH, RACES, type Character } from "@grunberg/engine";
import { useCharacterForm, type StatName } from "../../../hooks/useCharacterForm";
import styles from "./CharacterCreator.module.css";

interface CharacterCreatorProps {
  onCharacterCreated: (character: Character) => void;
  /** True while the game is being created: blocks a second submit. */
  submitting?: boolean;
  error?: string | null;
}

const STAT_NAMES: StatName[] = ["strength", "agility", "intelligence"];

const optionClass = (selected: boolean) =>
  selected ? `${styles.option} ${styles.selected}` : styles.option;

export const CharacterCreator = ({
  onCharacterCreated,
  submitting = false,
  error = null,
}: CharacterCreatorProps) => {
  const form = useCharacterForm();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const character = form.toCharacter();
    if (character && !submitting) onCharacterCreated(character);
  };

  return (
    <div className={styles["character-creator"]}>
      <h1>Create Your Character</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles["form-section"]}>
          <label htmlFor="character-name">Name:</label>
          <input
            id="character-name"
            className={styles["name-input"]}
            type="text"
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            placeholder="Enter character name"
            maxLength={MAX_NAME_LENGTH}
          />
        </div>

        <div className={styles["form-section"]}>
          <label>Race:</label>
          <div className={styles.options}>
            {RACES.map((r) => (
              <button
                key={r}
                type="button"
                className={optionClass(form.race === r)}
                onClick={() => form.selectRace(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className={styles["form-section"]}>
          <label>Gender:</label>
          <div className={styles.options}>
            <button
              type="button"
              className={optionClass(form.gender)}
              onClick={() => form.setGender(true)}
            >
              Male
            </button>
            <button
              type="button"
              className={optionClass(!form.gender)}
              onClick={() => form.setGender(false)}
            >
              Female
            </button>
          </div>
        </div>

        <div className={styles["form-section"]}>
          <label>Class:</label>
          <div className={styles.options}>
            {CLASSES.map((cls) => (
              <button
                key={cls}
                type="button"
                className={optionClass(form.characterClass === cls)}
                onClick={() => form.setCharacterClass(cls)}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        <div className={styles["form-section"]}>
          <label>Stats (Points remaining: {form.remainingPoints}):</label>
          <div className={styles["stats-container"]}>
            {STAT_NAMES.map((stat) => (
              <div key={stat} className={styles["stat-row"]}>
                <span className={styles["stat-name"]}>
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}:
                </span>
                <button
                  type="button"
                  onClick={() => form.decreaseStat(stat)}
                  disabled={!form.canDecrease(stat)}
                  className={styles["stat-button"]}
                >
                  -
                </button>
                <span className={styles["stat-value"]}>{form.stats[stat]}</span>
                <button
                  type="button"
                  onClick={() => form.increaseStat(stat)}
                  disabled={!form.canIncrease(stat)}
                  className={styles["stat-button"]}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!form.isValid || submitting}
          className={styles["submit-button"]}
        >
          {submitting ? "Creating…" : "Create Character"}
        </button>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
};
