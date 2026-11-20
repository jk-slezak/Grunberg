import { actionBody, gameParams, performIntents } from "@grunberg/game-server";
import { handle } from "@/server/http";
import { rateLimit, RULES } from "@/server/rateLimit";
import { readJson, readParams } from "@/server/request";
import { withSnapshot } from "@/server/snapshots";
import { getStore } from "@/server/store";

export const POST = (request: Request, { params }: RouteContext<"/api/games/[id]/actions">) =>
  handle(async () => {
    const { id } = await readParams(params, gameParams);
    const { expectedVersion, intents } = await readJson(request, actionBody);
    // Counted only after validation, so malformed requests can't use up the global quota.
    // Each intent counts: a batch must not be a way around the limit.
    await rateLimit(RULES.action, intents.length);
    const outcome = await performIntents(
      getStore().games,
      id,
      expectedVersion,
      intents,
      Date.now(),
    );
    return Response.json(withSnapshot(outcome));
  });
