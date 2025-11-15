import { useState, useEffect } from "react";
import "./App.css";
import CharacterCreator from "./components/CharacterCreator";
import { MainMenu } from "./components/organisms/MainMenu";
import { useGameState } from "./contexts/GameStateContext";
import { SaveService } from "./services/SaveService";
import { useAutoSave } from "./hooks/useAutoSave";
import type { Character } from "./types/character";
import { GameLayout } from "./components/templates/GameLayout";

type GameScreen = "menu" | "character-creator" | "game";

const App = () => {
  // const [character, setCharacter] = useState<Character | null>(null);
  const [screen, setScreen] = useState<GameScreen>("menu");
  const { state, createCharacter, loadState, resetState } = useGameState();

  useAutoSave(state, screen === "game");

  useEffect(() => {
    if (state.character && screen === "menu") {
      setScreen("game");
    }
  }, [state.character, screen]);

  const handleNewGame = () => {
    resetState();
    setScreen("character-creator");
  };

  const handleContinue = () => {
    const savedState = SaveService.loadFromLocalStorage();
    if (savedState) {
      loadState(savedState);
      setScreen("game");
    }
  };

  const handleLoadSave = async (file: File) => {
    try {
      const loadedState = await SaveService.importSave(file);
      loadState(loadedState);
      setScreen("game");
    } catch (error) {
      console.error("Failed to load save file:", error);
      throw error;
    }
  };

  const handleCharacterCreated = (newCharacter: Character) => {
    createCharacter(newCharacter);
    setScreen("game");
  };

  if (screen === "menu") {
    return (
      <MainMenu
        onNewGame={handleNewGame}
        onContinue={handleContinue}
        onLoadSave={handleLoadSave}
      />
    );
  }

  if (screen === "character-creator") {
    return <CharacterCreator onCharacterCreated={handleCharacterCreated} />;
  }

  return <GameLayout />;
};

export default App;
