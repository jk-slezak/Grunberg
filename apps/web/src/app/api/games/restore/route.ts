import { restoreGame, restoreGameBody } from "@grunberg/game-server";
import { handle } from "@/server/http";
import { rateLimit, RULES } from "@/server/rateLimit";
import { readJson } from "@/server/request";
import { MAX_RESTORE_BODY_BYTES, openSnapshot, withSnapshot } from "@/server/snapshots";
import { getStore } from "@/server/store";

/** Continues a game from a snapshot this server signed (e.g. after the server copy expired). */
export const POST = (request: Request) =>
  handle(async () => {
    const { snapshot } = await readJson(request, restoreGameBody, MAX_RESTORE_BODY_BYTES);
    const state = openSnapshot(snapshot);
    // A restore creates a game, so it shares the creation limit. Counted after the signature
    // check, so forged or broken snapshots can't use up the quota.
    await rateLimit(RULES.createGame);
    const game = await restoreGame(getStore().games, state, Date.now());
    return Response.json(withSnapshot(game), { status: 201 });
  });
