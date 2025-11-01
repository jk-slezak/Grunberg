import { useState } from "react";
import type { Character, Race, CharacterStats } from "../types/character";
import {
  RACES,
  INITIAL_STAT_POINTS,
  MIN_STAT_VALUE,
  MAX_STAT_VALUE,
} from "../types/character";
import "./CharacterCreator.css";

interface CharacterCreatorProps {
  onCharacterCreated: (character: Character) => void;
}

export default function CharacterCreator({
  onCharacterCreated,
}: CharacterCreatorProps) {
  const [name, setName] = useState("");
  const [race, setRace] = useState<Race>("Human");
  const [stats, setStats] = useState<CharacterStats>({
    strength: 5,
    agility: 5,
    intelligence: 5,
  });

  const totalPoints = stats.strength + stats.agility + stats.intelligence;
  const remainingPoints = INITIAL_STAT_POINTS - totalPoints;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && remainingPoints === 0) {
      onCharacterCreated({ name: name.trim(), race, stats });
    }
  };

  const isValid = name.trim() !== "" && remainingPoints === 0;

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
            maxLength={20}
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
                onClick={() => setRace(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label>Stats (Points remaining: {remainingPoints}):</label>
          <div className="stats-container">
            {(Object.keys(stats) as Array<keyof CharacterStats>).map((stat) => (
              <div key={stat} className="stat-row">
                <span className="stat-name">
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}:
                </span>
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
