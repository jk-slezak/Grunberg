import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@grunberg/engine";
import { importSaveFile } from "./saveFile";
import { createSession, MAX_SAVE_BYTES, parseSession } from "./session";

const NOW = 1_700_000_000_000;
const game = {
  id: "11111111-1111-4111-8111-111111111111",
  version: 3,
  state: createInitialGameState(NOW),
  snapshot: "v1.payload.signature",
};
const serialized = JSON.stringify(createSession(game, NOW));

describe("parseSession", () => {
  it("round-trips a session", () => {
    expect(parseSession(serialized)).toEqual({
      version: "2.0.0",
      gameId: game.id,
      snapshot: game.snapshot,
      savedAt: NOW,
    });
  });

  it.each([
    ["nothing", null],
    ["broken JSON", "{"],
    [
      "a version 1 save (raw, unsigned state)",
      JSON.stringify({ version: "1.0.0", state: game.state, timestamp: NOW }),
    ],
    ["a game id that isn't a UUID", serialized.replace(game.id, "../../api/cron/cleanup")],
    ["an empty snapshot", serialized.replace(game.snapshot, "")],
    ["an oversized save", "x".repeat(MAX_SAVE_BYTES + 1)],
  ])("returns null for %s", (_, input) => {
    expect(parseSession(input)).toBeNull();
  });
});

describe("importSaveFile", () => {
  it("returns the snapshot of a valid save file", async () => {
    expect(await importSaveFile(new File([serialized], "save.json"))).toBe(game.snapshot);
  });

  it("rejects files over the size limit without reading them", async () => {
    const big = new File(["x".repeat(MAX_SAVE_BYTES + 1)], "save.json");
    await expect(importSaveFile(big)).rejects.toThrow("too large");
  });

  it("rejects files that are not saves", async () => {
    await expect(importSaveFile(new File(["{}"], "save.json"))).rejects.toThrow("not a valid");
  });
});
