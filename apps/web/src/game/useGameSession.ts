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
import { loadSession, saveSession } from "../services/session";
import { describeIntent, describeRejection, narrateEvents, systemMessage } from "./narration";

export const GAME_QUERY_KEY = ["game"] as const;

/** At most one request per interval: Vercel Firewall allows 60 requests a minute per IP. */
export const SEND_INTERVAL_MS = 1200;
/** The fastest walking pace. Held keys repeat faster than this. */
export const STEP_INTERVAL_MS = 125;

/** Predictions only decide what to show; the server's clock stamps the real result. */
const PREDICTION = { now: 0 };

export class NoSavedGame extends Error {
  constructor() {
    super("No saved game");
    this.name = "NoSavedGame";
  }
}

/** Loads the saved game. If the server copy expired, restores it from the signed snapshot. */
export const loadGame = async (): Promise<GameView> => {
  const session = loadSession();
  if (!session) throw new NoSavedGame();
  try {
    return await api.getGame(session.gameId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return api.restoreGame(session.snapshot);
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

/** Intents sent in one request, and the version they were based on. */
interface Batch {
  id: string;
  expectedVersion: number;
  intents: Intent[];
}

export type GameSessionStatus = "loading" | "ready" | "missing" | "error";

export interface GameSession {
  status: GameSessionStatus;
  /** What the player sees: the server's state plus their moves the server hasn't confirmed yet. */
  state: GameState | null;
  /** Asks to do something. Applied on screen at once, sent to the server shortly after. */
  push: (intent: Intent) => void;
}

/**
 * Server reconciliation: the query cache holds only what the server confirmed, and the screen
 * shows that state with the pending intents replayed on top by the same engine the server runs.
 * Success replaces the base; any failure drops the pending intents, which is the rollback.
 */
export const useGameSession = (onMessages: (messages: MessageDraft[]) => void): GameSession => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: GAME_QUERY_KEY,
    queryFn: loadGame,
    // The cache changes only through this hook's requests. A refetch racing a request could
    // bring back an older version; another tab's changes arrive as a 409 instead.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: (failures, error) =>
      !(error instanceof ApiError || error instanceof NoSavedGame) && failures < 2,
  });
  const confirmed = query.data;

  const [queued, setQueued] = useState<Intent[]>([]);
  const [inFlight, setInFlight] = useState<Batch | null>(null);
  const lastSentAt = useRef(0);
  const lastStepAt = useRef(0);

  const { mutate } = useMutation({
    mutationFn: ({ id, expectedVersion, intents }: Batch) =>
      api.sendIntents(id, expectedVersion, intents),
    // A load still running would overwrite the result of this request with an older state.
    onMutate: () => queryClient.cancelQueries({ queryKey: GAME_QUERY_KEY }),
    onSuccess: (outcome) => {
      queryClient.setQueryData(GAME_QUERY_KEY, toGameView(outcome));
      if (outcome.rejected) {
        // Later intents assumed the refused one would succeed.
        setQueued([]);
        onMessages([describeRejection(outcome.rejected.reason)]);
      }
    },
    onError: (error) => {
      setInFlight(null);
      setQueued([]);
      onMessages([errorMessage(error)]);
      if (!(error instanceof ApiError)) return;
      if (error.status === 409 && error.body.current) {
        queryClient.setQueryData(GAME_QUERY_KEY, toGameView(error.body.current));
      } else if (error.status === 404) {
        void queryClient.invalidateQueries({ queryKey: GAME_QUERY_KEY });
      } else if (error.status === 429 && error.retryAfterSeconds) {
        lastSentAt.current = Date.now() + error.retryAfterSeconds * 1000 - SEND_INTERVAL_MS;
      }
    },
  });

  // In flight until the server's version moves past the one it was based on. Tied to the
  // version, not to the request's status, so the screen never shows a frame without it.
  const outstanding =
    inFlight !== null &&
    confirmed !== undefined &&
    inFlight.id === confirmed.id &&
    inFlight.expectedVersion === confirmed.version;

  const pending = useMemo(
    () => (outstanding && inFlight ? [...inFlight.intents, ...queued] : queued),
    [outstanding, inFlight, queued],
  );
  const state = useMemo(
    () => (confirmed ? applyIntents(confirmed.state, pending, PREDICTION).state : null),
    [confirmed, pending],
  );

  // Every state the server confirms is the player's new local save.
  useEffect(() => {
    if (confirmed) saveSession(confirmed, Date.now());
  }, [confirmed]);

  // One request at a time, at most one per SEND_INTERVAL_MS, carrying everything queued.
  useEffect(() => {
    if (!confirmed || outstanding || queued.length === 0) return;
    const wait = Math.max(0, lastSentAt.current + SEND_INTERVAL_MS - Date.now());
    const timer = window.setTimeout(() => {
      const batch = { id: confirmed.id, expectedVersion: confirmed.version, intents: queued };
      lastSentAt.current = Date.now();
      setInFlight(batch);
      setQueued((current) => current.slice(batch.intents.length));
      mutate(batch);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [confirmed, outstanding, queued, mutate]);

  const push = (intent: Intent) => {
    if (!state || queued.length >= MAX_INTENTS_PER_REQUEST) return;
    const now = Date.now();
    if (now - lastStepAt.current < STEP_INTERVAL_MS) return;
    lastStepAt.current = now;

    // The same rules the server runs: a refused move costs no request.
    const result = applyIntents(state, [intent], PREDICTION);
    if (result.rejected) {
      onMessages([describeRejection(result.rejected.reason)]);
      return;
    }
    onMessages([describeIntent(intent), ...narrateEvents(result.events)]);
    setQueued((current) => [...current, intent]);
  };

  const status: GameSessionStatus = query.isPending
    ? "loading"
    : query.error instanceof NoSavedGame
      ? "missing"
      : query.isError
        ? "error"
        : "ready";

  return { status, state, push };
};
