"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/api/client";
import { MainMenu } from "@/components/organisms/MainMenu";
import { GAME_QUERY_KEY } from "@/game/useGameSession";
import { useStartGame } from "@/game/useStartGame";
import { importSaveFile } from "@/services/saveFile";

export const MenuScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { startAsync: restore } = useStartGame(api.restoreGame);

  const continueGame = () => {
    queryClient.removeQueries({ queryKey: GAME_QUERY_KEY });
    router.push("/game");
  };

  const loadSaveFile = async (file: File) => {
    await restore(await importSaveFile(file));
  };

  return (
    <MainMenu
      onNewGame={() => router.push("/new")}
      onContinue={continueGame}
      onLoadSave={loadSaveFile}
    />
  );
};
