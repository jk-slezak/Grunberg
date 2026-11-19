"use client";

import { useRouter } from "next/navigation";
import { MainMenu } from "@/components/organisms/MainMenu";
import { useGameActions } from "@/contexts/useGameActions";
import { importSaveFile } from "@/services/saveFile";
import { loadSavedGame } from "@/services/saveStorage";

export const MenuScreen = () => {
  const router = useRouter();
  const { loadState, resetState } = useGameActions();

  const startNewGame = () => {
    resetState();
    router.push("/new");
  };

  const continueGame = () => {
    const saved = loadSavedGame();
    if (!saved) return;
    loadState(saved);
    router.push("/game");
  };

  const loadSaveFile = async (file: File) => {
    loadState(await importSaveFile(file));
    router.push("/game");
  };

  return <MainMenu onNewGame={startNewGame} onContinue={continueGame} onLoadSave={loadSaveFile} />;
};
