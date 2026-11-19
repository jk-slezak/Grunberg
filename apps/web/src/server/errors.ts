export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export const badRequest = (message = "Invalid request") => new HttpError(400, message);
export const forbidden = () => new HttpError(403, "Cross-origin requests are not allowed");
export const payloadTooLarge = () => new HttpError(413, "Request body too large");
export const unsupportedMediaType = () =>
  new HttpError(415, "Content-Type must be application/json");
