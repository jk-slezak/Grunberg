import { timingSafeEqual } from "node:crypto";
import { deleteExpiredData } from "@grunberg/game-server";
import { getStore } from "@/server/store";

const isAuthorized = (request: Request): boolean => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export const GET = async (request: Request) => {
  if (!isAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { games, rateLimits } = getStore();
  return Response.json(await deleteExpiredData(games, rateLimits, Date.now()));
};
