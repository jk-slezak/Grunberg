import {
  applyAction,
  createInitialGameState,
  type Character,
  type GameEvent,
} from "@grunberg/engine";
import { GameNotFound, NoEffect, StaleVersion } from "./errors";
import { intentToAction } from "./intents";
import { VersionConflict, type GameRepository, type StoredGame } from "./repository";
import { activeSince } from "./retention";
import type { Intent } from "./schemas";

export const createGame = async (repo: GameRepository, character: Character, now: number) => {
  const { state, events } = applyAction(
    createInitialGameState(now),
    { type: "CREATE_CHARACTER", payload: character },
    { now },
  );
  return repo.create(state, events);
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

export const performIntent = async (
  repo: GameRepository,
  id: string,
  expectedVersion: number,
  intent: Intent,
  now: number,
): Promise<StoredGame & { events: GameEvent[] }> => {
  const game = await getGame(repo, id, now);
  if (game.version !== expectedVersion) throw new StaleVersion(game);

  const { state, events } = applyAction(game.state, intentToAction(game.state, intent), { now });
  if (events.length === 0) throw new NoEffect();

  try {
    const saved = await repo.save(id, expectedVersion, state, events);
    return { ...saved, events };
  } catch (err) {
    if (err instanceof VersionConflict) throw new StaleVersion(await getGame(repo, id, now));
    throw err;
  }
};
