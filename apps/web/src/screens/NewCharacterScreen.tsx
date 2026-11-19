"use client";

import { useRouter } from "next/navigation";
import type { Character } from "@grunberg/engine";
import { CharacterCreator } from "@/components/organisms/CharacterCreator";
import { useGameActions } from "@/contexts/useGameActions";

export const NewCharacterScreen = () => {
  const router = useRouter();
  const { createCharacter } = useGameActions();

  const handleCharacterCreated = (character: Character) => {
    createCharacter(character);
    router.push("/game");
  };

  return <CharacterCreator onCharacterCreated={handleCharacterCreated} />;
};
