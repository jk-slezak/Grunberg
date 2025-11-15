import { useState } from "react";
import "./App.css";
import CharacterCreator from "./components/CharacterCreator";
import type { Character } from "./types/character";

function App() {
  const [character, setCharacter] = useState<Character | null>(null);

  const handleCharacterCreated = (newCharacter: Character) => {
    setCharacter(newCharacter);
  };

  if (!character) {
    return <CharacterCreator onCharacterCreated={handleCharacterCreated} />;
  }

  return (
    <div>
      <h1>Welcome, {character.name}!</h1>
      <p>Race: {character.race}</p>
      <p>Gender: {character.gender ? "Male" : "Female"}</p>
      <p>Class: {character.class}</p>
      <p>Strength: {character.stats.strength}</p>
      <p>Agility: {character.stats.agility}</p>
      <p>Intelligence: {character.stats.intelligence}</p>
      <button onClick={() => setCharacter(null)}>Create New Character</button>
    </div>
  );
}

export default App;
