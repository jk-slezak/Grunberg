import { useState } from "react";
import {
  CLASSES,
  INITIAL_STAT_POINTS,
  isValidCharacterName,
  MAX_NAME_LENGTH,
  MAX_STAT_VALUE,
  MIN_STAT_VALUE,
  normalizeCharacterName,
  RACE_BASE_STATS,
  RACES,
  sumStats,
  type Character,
  type CharacterClass,
  type CharacterStats,
  type Race,
} from "@grunberg/engine";
import "./CharacterCreator.css";

interface CharacterCreatorProps {
  onCharacterCreated: (character: Character) => void;
}

export default function CharacterCreator({ onCharacterCreated }: CharacterCreatorProps) {
  const [name, setName] = useState("");
  const [race, setRace] = useState<Race>("Human");
  const [gender, setGender] = useState<boolean>(true);
  const [characterClass, setCharacterClass] = useState<CharacterClass>("Warrior");
  const [stats, setStats] = useState<CharacterStats>(RACE_BASE_STATS.Human);

  const remainingPoints = INITIAL_STAT_POINTS - sumStats(stats);
  const isValid = isValidCharacterName(name) && remainingPoints === 0;

  const canIncrease = (stat: keyof CharacterStats) => {
    return stats[stat] < MAX_STAT_VALUE && remainingPoints > 0;
  };

  const canDecrease = (stat: keyof CharacterStats) => {
    return stats[stat] > MIN_STAT_VALUE;
  };

  const increaseStat = (stat: keyof CharacterStats) => {
    if (canIncrease(stat)) {
      setStats({ ...stats, [stat]: stats[stat] + 1 });
    }
  };

  const decreaseStat = (stat: keyof CharacterStats) => {
    if (canDecrease(stat)) {
      setStats({ ...stats, [stat]: stats[stat] - 1 });
    }
  };

  const handleRaceChange = (newRace: Race) => {
    setRace(newRace);
    setStats(RACE_BASE_STATS[newRace]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onCharacterCreated({
        name: normalizeCharacterName(name),
        race,
        gender,
        class: characterClass,
        stats,
      });
    }
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
            value={name}
            onChange={(e) => setName(e.target.value)}
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
                className={`race-button ${race === r ? "selected" : ""}`}
                onClick={() => handleRaceChange(r)}
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
              className={`race-button ${gender ? "selected" : ""}`}
              onClick={() => setGender(true)}
            >
              Male
            </button>
            <button
              type="button"
              className={`race-button ${!gender ? "selected" : ""}`}
              onClick={() => setGender(false)}
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
                className={`race-button ${characterClass === cls ? "selected" : ""}`}
                onClick={() => setCharacterClass(cls)}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label>Stats (Points remaining: {remainingPoints}):</label>
          <div className="stats-container">
            {(Object.keys(stats) as Array<keyof CharacterStats>).map((stat) => (
              <div key={stat} className="stat-row">
                <span className="stat-name">{stat.charAt(0).toUpperCase() + stat.slice(1)}:</span>
                <button
                  type="button"
                  onClick={() => decreaseStat(stat)}
                  disabled={!canDecrease(stat)}
                  className="stat-button"
                >
                  -
                </button>
                <span className="stat-value">{stats[stat]}</span>
                <button
                  type="button"
                  onClick={() => increaseStat(stat)}
                  disabled={!canIncrease(stat)}
                  className="stat-button"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={!isValid} className="submit-button">
          Create Character
        </button>
      </form>
    </div>
  );
}
