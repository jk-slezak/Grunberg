import { useState } from "react";
import "./App.css";
import CharacterCreator from "./components/CharacterCreator";
import type { Character } from "./types/character";
import { GameLayout } from "./components/templates/GameLayout";

const App = () => {
  const [character, setCharacter] = useState<Character | null>(null);

  const handleCharacterCreated = (newCharacter: Character) => {
    setCharacter(newCharacter);
  };

  if (!character) {
    return <CharacterCreator onCharacterCreated={handleCharacterCreated} />;
  }

  return <GameLayout />;
};

export default App;
