"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GameLayout } from "@/components/templates/GameLayout";
import { COMMAND_HELP, parseCommand } from "@/game/commands";
import { systemMessage } from "@/game/narration";
import { useGameSession } from "@/game/useGameSession";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useMovementKeys } from "@/hooks/useMovementKeys";

export const GameScreen = () => {
  const router = useRouter();
  const { messages, append } = useChatMessages();
  const { status, state, push } = useGameSession(append);
  useMovementKeys(push);

  useEffect(() => {
    if (status === "missing") router.replace("/");
  }, [status, router]);

  const onCommand = (text: string) => {
    const intent = parseCommand(text);
    if (intent) push(intent);
    else append([{ type: "action", text }, systemMessage(COMMAND_HELP)]);
  };

  if (status === "error") {
    return (
      <p role="alert">
        Nie udało się wczytać gry. <Link href="/">Wróć do menu</Link>
      </p>
    );
  }
  if (!state) return null;
  return <GameLayout state={state} messages={messages} onCommand={onCommand} />;
};
