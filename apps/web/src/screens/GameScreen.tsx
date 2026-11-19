"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameLayout } from "@/components/templates/GameLayout";
import { useGameState } from "@/contexts/useGameState";
import { useAutoSave } from "@/hooks/useAutoSave";

export const GameScreen = () => {
  const router = useRouter();
  const state = useGameState();
  const hasCharacter = state.character !== null;

  useAutoSave(state, hasCharacter);

  useEffect(() => {
    if (!hasCharacter) router.replace("/");
  }, [hasCharacter, router]);

  return hasCharacter ? <GameLayout /> : null;
};
