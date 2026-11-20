import { restoreGame, restoreGameBody } from "@grunberg/game-server";
import { handle } from "@/server/http";
import { rateLimit, RULES } from "@/server/rateLimit";
import { readJson } from "@/server/request";
import { MAX_RESTORE_BODY_BYTES, openSnapshot, withSnapshot } from "@/server/snapshots";
import { getStore } from "@/server/store";

export const POST = (request: Request) =>
  handle(async () => {
    const { snapshot } = await readJson(request, restoreGameBody, MAX_RESTORE_BODY_BYTES);
    const state = openSnapshot(snapshot);
    await rateLimit(RULES.createGame);
    const game = await restoreGame(getStore().games, state, Date.now());
    return Response.json(withSnapshot(game), { status: 201 });
  });
