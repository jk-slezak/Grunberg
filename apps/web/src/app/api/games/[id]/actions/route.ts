import { actionBody, gameParams, performIntent } from "@grunberg/game-server";
import { handle } from "@/server/http";
import { rateLimit, RULES } from "@/server/rateLimit";
import { readJson, readParams } from "@/server/request";
import { getStore } from "@/server/store";

export const POST = (request: Request, { params }: RouteContext<"/api/games/[id]/actions">) =>
  handle(async () => {
    await rateLimit(RULES.action);
    const { id } = await readParams(params, gameParams);
    const { expectedVersion, intent } = await readJson(request, actionBody);
    return Response.json(
      await performIntent(getStore().games, id, expectedVersion, intent, Date.now()),
    );
  });
