import { createGame, createGameBody } from "@grunberg/game-server";
import { handle } from "@/server/http";
import { rateLimit, RULES } from "@/server/rateLimit";
import { readJson } from "@/server/request";
import { getStore } from "@/server/store";

export const POST = (request: Request) =>
  handle(async () => {
    await rateLimit(RULES.createGame);
    const { character } = await readJson(request, createGameBody);
    const game = await createGame(getStore().games, character, Date.now());
    return Response.json(game, { status: 201 });
  });
