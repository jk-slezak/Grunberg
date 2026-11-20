import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyIntents,
  MAX_INTENTS_PER_REQUEST,
  type GameState,
  type Intent,
} from "@grunberg/engine";
import { api, ApiError, toGameView, type GameView } from "../api/client";
import type { MessageDraft } from "../chat/types";
import { clearSession, loadSession, saveSession } from "../services/session";
import { describeIntent, describeRejection, narrateEvents, systemMessage } from "./narration";

export const GAME_QUERY_KEY = ["game"] as const;

export const SEND_INTERVAL_MS = 1200;
export const STEP_INTERVAL_MS = 125;

const PREDICTION_CONTEXT = { now: 0 };

export class NoSavedGame extends Error {
  constructor() {
    super("No saved game");
    this.name = "NoSavedGame";
  }
}

const isStatus = (error: unknown, status: number) =>
  error instanceof ApiError && error.status === status;

const restoreFromSnapshot = async (snapshot: string): Promise<GameView> => {
  try {
    return await api.restoreGame(snapshot);
  } catch (error) {
    if (isStatus(error, 400)) {
      clearSession();
      throw new NoSavedGame();
    }
    throw error;
  }
};

export const loadGame = async (): Promise<GameView> => {
  const session = loadSession();
  if (!session) throw new NoSavedGame();
  try {
    return await api.getGame(session.gameId);
  } catch (error) {
    if (isStatus(error, 404)) return restoreFromSnapshot(session.snapshot);
    throw error;
  }
};

const errorMessage = (error: unknown): MessageDraft => {
  if (!(error instanceof ApiError)) {
    return systemMessage("Brak połączenia z serwerem. Ruch cofnięty.");
  }
  switch (error.status) {
    case 404:
      return systemMessage("Kopia gry na serwerze wygasła. Przywracam ją z zapisu…");
    case 409:
      return systemMessage("Gra zmieniła się w innej karcie. Wczytano aktualny stan.");
    case 422:
      return describeRejection(error.body.reason);
    case 429:
      return systemMessage("Za dużo ruchów naraz. Odczekaj chwilę.");
    default:
      return systemMessage("Serwer nie przyjął ruchu. Ruch cofnięty.");
  }
};

interface Batch {
  id: string;
  expectedVersion: number;
  intents: Intent[];
}

export type GameSessionStatus = "loading" | "ready" | "missing" | "error";

const sessionStatus = (query: { isPending: boolean; error: unknown }): GameSessionStatus => {
  if (query.isPending) return "loading";
  if (query.error instanceof NoSavedGame) return "missing";
  if (query.error) return "error";
  return "ready";
};

export interface GameSession {
  status: GameSessionStatus;
  state: GameState | null;
  push: (intent: Intent) => void;
}

export const useGameSession = (onMessages: (messages: MessageDraft[]) => void): GameSession => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: GAME_QUERY_KEY,
    queryFn: loadGame,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: (failures, error) =>
      !(error instanceof ApiError || error instanceof NoSavedGame) && failures < 2,
  });
  const confirmed = query.data;

  const [queued, setQueued] = useState<Intent[]>([]);
  const [inFlight, setInFlight] = useState<Batch | null>(null);
  const nextSendAllowedAt = useRef(0);
  const lastStepAt = useRef(0);

  const discardPendingIntents = () => {
    setInFlight(null);
    setQueued([]);
  };

  const { mutate } = useMutation({
    mutationFn: ({ id, expectedVersion, intents }: Batch) =>
      api.sendIntents(id, expectedVersion, intents),
    onMutate: () => queryClient.cancelQueries({ queryKey: GAME_QUERY_KEY }),
    onSuccess: (outcome) => {
      queryClient.setQueryData(GAME_QUERY_KEY, toGameView(outcome));
      if (outcome.rejected) {
        discardPendingIntents();
        onMessages([describeRejection(outcome.rejected.reason)]);
      }
    },
    onError: (error) => {
      discardPendingIntents();
      onMessages([errorMessage(error)]);
      if (!(error instanceof ApiError)) return;
      if (error.status === 409 && error.body.current) {
        queryClient.setQueryData(GAME_QUERY_KEY, toGameView(error.body.current));
      } else if (error.status === 404) {
        void queryClient.invalidateQueries({ queryKey: GAME_QUERY_KEY });
      } else if (error.status === 429 && error.retryAfterSeconds) {
        nextSendAllowedAt.current = Date.now() + error.retryAfterSeconds * 1000;
      }
    },
  });

  const awaitingConfirmation =
    inFlight !== null &&
    confirmed !== undefined &&
    inFlight.id === confirmed.id &&
    inFlight.expectedVersion === confirmed.version;

  const pending = useMemo(
    () => (awaitingConfirmation && inFlight ? [...inFlight.intents, ...queued] : queued),
    [awaitingConfirmation, inFlight, queued],
  );
  const state = useMemo(
    () => (confirmed ? applyIntents(confirmed.state, pending, PREDICTION_CONTEXT).state : null),
    [confirmed, pending],
  );

  useEffect(() => {
    if (confirmed) saveSession(confirmed, Date.now());
  }, [confirmed]);

  useEffect(() => {
    if (!confirmed || awaitingConfirmation || queued.length === 0) return;
    const wait = Math.max(0, nextSendAllowedAt.current - Date.now());
    const timer = window.setTimeout(() => {
      const batch = { id: confirmed.id, expectedVersion: confirmed.version, intents: queued };
      nextSendAllowedAt.current = Date.now() + SEND_INTERVAL_MS;
      setInFlight(batch);
      setQueued((current) => current.slice(batch.intents.length));
      mutate(batch);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [confirmed, awaitingConfirmation, queued, mutate]);

  const push = (intent: Intent) => {
    if (!state || queued.length >= MAX_INTENTS_PER_REQUEST) return;
    const now = Date.now();
    const fasterThanWalkingPace = now - lastStepAt.current < STEP_INTERVAL_MS;
    if (fasterThanWalkingPace) return;
    lastStepAt.current = now;

    const prediction = applyIntents(state, [intent], PREDICTION_CONTEXT);
    if (prediction.rejected) {
      onMessages([describeRejection(prediction.rejected.reason)]);
      return;
    }
    onMessages([describeIntent(intent), ...narrateEvents(prediction.events)]);
    setQueued((current) => [...current, intent]);
  };

  return { status: sessionStatus(query), state, push };
};
