import { describe, expect, it } from "vitest";
import { handle } from "./http";

describe("handle", () => {
  it("does not disguise unexpected errors as client errors: they surface as 500s", async () => {
    await expect(handle(async () => JSON.parse("{"))).rejects.toBeInstanceOf(SyntaxError);
    await expect(
      handle(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});
