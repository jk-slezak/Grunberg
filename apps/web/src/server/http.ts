import { ZodError } from "zod";
import {
  GameNotFound,
  IntentRejected,
  NoEffect,
  RateLimited,
  StaleVersion,
} from "@grunberg/game-server";
import { HttpError } from "./errors";

const json = (status: number, body: object, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers });

const errorResponse = (error: unknown): Response => {
  if (error instanceof HttpError)
    return json(error.status, { error: error.message }, error.headers);
  if (error instanceof ZodError)
    return json(400, { error: "Invalid request", issues: error.issues });
  if (error instanceof GameNotFound) return json(404, { error: error.message });
  if (error instanceof StaleVersion)
    return json(409, { error: error.message, current: error.current });
  if (error instanceof IntentRejected || error instanceof NoEffect)
    return json(422, { error: error.message });
  if (error instanceof RateLimited) {
    return json(429, { error: error.message }, { "Retry-After": String(error.retryAfterSeconds) });
  }
  throw error;
};

export const handle = async (run: () => Promise<Response>): Promise<Response> => {
  try {
    return await run();
  } catch (error) {
    return errorResponse(error);
  }
};
