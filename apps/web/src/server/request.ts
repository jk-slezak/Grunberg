import type { z } from "zod";
import { badRequest, forbidden, payloadTooLarge, unsupportedMediaType } from "./errors";

export const MAX_BODY_BYTES = 16 * 1024;

const assertSameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  if (origin === null) return;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw forbidden();
  }
  if (originHost !== new URL(request.url).host) throw forbidden();
};

const assertJsonContentType = (request: Request) => {
  const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type !== "application/json") throw unsupportedMediaType();
};

const readLimitedText = async (request: Request, maxBytes: number): Promise<string> => {
  const declared = Number(request.headers.get("content-length"));
  if (declared > maxBytes) throw payloadTooLarge();
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw payloadTooLarge();
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
};

export const readJson = async <T extends z.ZodType>(
  request: Request,
  schema: T,
  maxBytes = MAX_BODY_BYTES,
): Promise<z.output<T>> => {
  assertSameOrigin(request);
  assertJsonContentType(request);
  const text = await readLimitedText(request, maxBytes);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw badRequest("Invalid JSON");
  }
  return schema.parse(json);
};

export const readParams = async <T extends z.ZodType>(
  params: Promise<unknown>,
  schema: T,
): Promise<z.output<T>> => schema.parse(await params);
