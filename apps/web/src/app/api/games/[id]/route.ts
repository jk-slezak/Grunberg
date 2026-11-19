import { gameParams, getGame } from "@grunberg/game-server";
import { handle } from "@/server/http";
import { readParams } from "@/server/request";
import { getStore } from "@/server/store";

export const GET = (_request: Request, { params }: RouteContext<"/api/games/[id]">) =>
  handle(async () => {
    const { id } = await readParams(params, gameParams);
    return Response.json(await getGame(getStore().games, id, Date.now()));
  });
