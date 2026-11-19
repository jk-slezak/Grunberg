import type { FormEvent } from "react";
import { CLASSES, MAX_NAME_LENGTH, RACES, type Character } from "@grunberg/engine";
import { useCharacterForm, type StatName } from "../hooks/useCharacterForm";
import "./CharacterCreator.css";

interface CharacterCreatorProps {
  onCharacterCreated: (character: Character) => void;
}

const STAT_NAMES: StatName[] = ["strength", "agility", "intelligence"];

export default function CharacterCreator({ onCharacterCreated }: CharacterCreatorProps) {
  const form = useCharacterForm();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const character = form.toCharacter();
    if (character) onCharacterCreated(character);
  };

  return (
    <div className="character-creator">
      <h1>Create Your Character</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <label htmlFor="character-name">Name:</label>
          <input
            id="character-name"
            type="text"
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            placeholder="Enter character name"
            maxLength={MAX_NAME_LENGTH}
          />
        </div>

        <div className="form-section">
          <label>Race:</label>
          <div className="race-selection">
            {RACES.map((r) => (
              <button
                key={r}
                type="button"
                className={`race-button ${form.race === r ? "selected" : ""}`}
                onClick={() => form.selectRace(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label>Gender:</label>
          <div className="race-selection">
            <button
              type="button"
              className={`race-button ${form.gender ? "selected" : ""}`}
              onClick={() => form.setGender(true)}
            >
              Male
            </button>
            <button
              type="button"
              className={`race-button ${!form.gender ? "selected" : ""}`}
              onClick={() => form.setGender(false)}
            >
              Female
            </button>
          </div>
        </div>

        <div className="form-section">
          <label>Class:</label>
          <div className="race-selection">
            {CLASSES.map((cls) => (
              <button
                key={cls}
                type="button"
                className={`race-button ${form.characterClass === cls ? "selected" : ""}`}
                onClick={() => form.setCharacterClass(cls)}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label>Stats (Points remaining: {form.remainingPoints}):</label>
          <div className="stats-container">
            {STAT_NAMES.map((stat) => (
              <div key={stat} className="stat-row">
                <span className="stat-name">{stat.charAt(0).toUpperCase() + stat.slice(1)}:</span>
                <button
                  type="button"
                  onClick={() => form.decreaseStat(stat)}
                  disabled={!form.canDecrease(stat)}
                  className="stat-button"
                >
                  -
                </button>
                <span className="stat-value">{form.stats[stat]}</span>
                <button
                  type="button"
                  onClick={() => form.increaseStat(stat)}
                  disabled={!form.canIncrease(stat)}
                  className="stat-button"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={!form.isValid} className="submit-button">
          Create Character
        </button>
      </form>
    </div>
  );
}
