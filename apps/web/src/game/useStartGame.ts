import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ApiError, type GameView } from "../api/client";
import { saveSession } from "../services/session";
import { GAME_QUERY_KEY } from "./useGameSession";

const startErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) return "Could not reach the server. Try again.";
  if (error.status === 429) return "Too many new games right now. Try again in a while.";
  if (error.status === 400) return "The server refused this save or character.";
  return "Something went wrong. Try again.";
};

/**
 * Starts playing a game the server just created or restored: saves it locally, puts it in
 * the cache (so /game needn't load it again) and opens the game screen.
 */
export const useStartGame = <T>(start: (input: T) => Promise<GameView>) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: start,
    onSuccess: (game) => {
      saveSession(game, Date.now());
      queryClient.setQueryData(GAME_QUERY_KEY, game);
      router.push("/game");
    },
  });
  return {
    start: mutation.mutate,
    startAsync: mutation.mutateAsync,
    pending: mutation.isPending,
    error: mutation.error ? startErrorMessage(mutation.error) : null,
  };
};
