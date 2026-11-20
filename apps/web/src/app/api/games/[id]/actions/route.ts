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
    await rateLimit(RULES.action);
    const outcome = await performIntents(
      getStore().games,
      id,
      expectedVersion,
      intents,
      Date.now(),
    );
    return Response.json(withSnapshot(outcome));
  });
