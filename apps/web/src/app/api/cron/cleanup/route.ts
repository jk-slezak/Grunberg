import { timingSafeEqual } from "node:crypto";
import { deleteExpiredData } from "@grunberg/game-server";
import { getStore } from "@/server/store";

const equalsInConstantTime = (actual: string, expected: string): boolean => {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
};

const isAuthorized = (request: Request): boolean => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return equalsInConstantTime(request.headers.get("authorization") ?? "", `Bearer ${secret}`);
};

export const GET = async (request: Request) => {
  if (!isAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { games, rateLimits } = getStore();
  return Response.json(await deleteExpiredData(games, rateLimits, Date.now()));
};
