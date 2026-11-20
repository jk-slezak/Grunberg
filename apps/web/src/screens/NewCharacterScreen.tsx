"use client";

import { api } from "@/api/client";
import { CharacterCreator } from "@/components/organisms/CharacterCreator";
import { useStartGame } from "@/game/useStartGame";

export const NewCharacterScreen = () => {
  const { start, pending, error } = useStartGame(api.createGame);
  return <CharacterCreator onCharacterCreated={start} submitting={pending} error={error} />;
};
