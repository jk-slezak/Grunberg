import { createGame, createGameBody } from "@grunberg/game-server";
import { handle } from "@/server/http";
import { rateLimit, RULES } from "@/server/rateLimit";
import { readJson } from "@/server/request";
import { withSnapshot } from "@/server/snapshots";
import { getStore } from "@/server/store";

export const POST = (request: Request) =>
  handle(async () => {
    const { character } = await readJson(request, createGameBody);
    await rateLimit(RULES.createGame);
    const game = await createGame(getStore().games, character, Date.now());
    return Response.json(withSnapshot(game), { status: 201 });
  });
