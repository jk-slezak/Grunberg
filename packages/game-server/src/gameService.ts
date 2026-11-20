import { randomUUID } from "node:crypto";
import {
  applyAction,
  applyIntents,
  createInitialGameState,
  type Character,
  type GameEvent,
  type GameState,
  type GameStateAction,
  type Intent,
  type IntentsResult,
} from "@grunberg/engine";
import { GameNotFound, IntentRejected, StaleVersion } from "./errors";
import { VersionConflict, type GameRepository, type StoredGame } from "./repository";
import { activeSince } from "./retention";

export const MAX_REQUESTS_PER_GAME = 5000;

export const FIRST_FLOOR = 1;

const applyAll = (state: GameState, actions: GameStateAction[], now: number) =>
  actions.reduce(
    (acc, action) => {
      const result = applyAction(acc.state, action, { now });
      return { state: result.state, events: [...acc.events, ...result.events] };
    },
    { state, events: [] as GameEvent[] },
  );

export const createGame = async (
  repo: GameRepository,
  character: Character,
  now: number,
  seed: string = randomUUID(),
): Promise<StoredGame> => {
  const { state, events } = applyAll(
    createInitialGameState(now),
    [
      { type: "CREATE_CHARACTER", payload: character },
      { type: "ENTER_FLOOR", payload: { floorNumber: FIRST_FLOOR, seed } },
    ],
    now,
  );
  return repo.create(state, events);
};

export const restoreGame = async (
  repo: GameRepository,
  state: GameState,
  now: number,
): Promise<StoredGame> => {
  const loaded = applyAll(
    createInitialGameState(now),
    [{ type: "LOAD_STATE", payload: state }],
    now,
  );
  return repo.create(loaded.state, loaded.events);
};

export const getGame = async (
  repo: GameRepository,
  id: string,
  now: number,
): Promise<StoredGame> => {
  const game = await repo.get(id, activeSince(now));
  if (!game) throw new GameNotFound();
  return game;
};

export const getEvents = async (
  repo: GameRepository,
  id: string,
  now: number,
): Promise<GameEvent[]> => {
  await getGame(repo, id, now);
  return repo.events(id);
};

export type IntentsOutcome = StoredGame & Pick<IntentsResult, "events" | "rejected">;

export const performIntents = async (
  repo: GameRepository,
  id: string,
  expectedVersion: number,
  intents: Intent[],
  now: number,
): Promise<IntentsOutcome> => {
  const game = await getGame(repo, id, now);
  if (game.version !== expectedVersion) throw new StaleVersion(game);
  if (game.version >= MAX_REQUESTS_PER_GAME) throw new IntentRejected("length_limit");

  const { state, events, rejected } = applyIntents(game.state, intents, { now });
  if (rejected?.index === 0) throw new IntentRejected(rejected.reason);

  try {
    const saved = await repo.save(id, expectedVersion, state, events);
    return { ...saved, events, rejected };
  } catch (err) {
    if (err instanceof VersionConflict) throw new StaleVersion(await getGame(repo, id, now));
    throw err;
  }
};
