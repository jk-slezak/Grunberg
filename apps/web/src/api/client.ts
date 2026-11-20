import type { Character, GameEvent, GameState, Intent, IntentsResult } from "@grunberg/engine";

/** A game as the API returns it. `snapshot` is the signed copy the player keeps locally. */
export interface GameView {
  id: string;
  version: number;
  state: GameState;
  snapshot: string;
}

export interface IntentsOutcome extends GameView {
  events: GameEvent[];
  rejected?: IntentsResult["rejected"];
}

interface ErrorBody {
  error?: string;
  /** A rejection code on 422 (e.g. "blocked", "length_limit"). */
  reason?: string;
  /** The game as the server has it, on 409. */
  current?: GameView;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ErrorBody,
    /** From Retry-After on 429. */
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(body.error ?? `Request failed with status ${status}`);
    this.name = "ApiError";
  }
}

const call = async <T>(path: string, body?: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    // JSON content type: required by the API (it forces a CORS preflight on cross-site posts).
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const retryAfter = Number(response.headers.get("retry-after"));
    throw new ApiError(
      response.status,
      json as ErrorBody,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
    );
  }
  return json as T;
};

// Ids are UUIDs checked by the server; encoding keeps a corrupted local value from changing the path.
const gamePath = (id: string) => `/api/games/${encodeURIComponent(id)}`;

export const api = {
  createGame: (character: Character) => call<GameView>("/api/games", { character }),
  getGame: (id: string) => call<GameView>(gamePath(id)),
  restoreGame: (snapshot: string) => call<GameView>("/api/games/restore", { snapshot }),
  sendIntents: (id: string, expectedVersion: number, intents: Intent[]) =>
    call<IntentsOutcome>(`${gamePath(id)}/actions`, { expectedVersion, intents }),
};

/** Keeps only the game itself from a response that carries more (events, rejected). */
export const toGameView = ({ id, version, state, snapshot }: GameView): GameView => ({
  id,
  version,
  state,
  snapshot,
});
