import { describe, expect, it } from "vitest";
import { applyAction, createInitialGameState } from "@grunberg/engine";
import { createSaveData, parseSaveData } from "./saveData";
import { importSaveFile, MAX_SAVE_FILE_BYTES } from "./saveFile";

const NOW = 1_700_000_000_000;
const game = applyAction(
  createInitialGameState(NOW),
  {
    type: "CREATE_CHARACTER",
    payload: {
      name: "Aria",
      race: "Elf",
      gender: false,
      class: "Mage",
      stats: { strength: 3, agility: 5, intelligence: 7 },
    },
  },
  { now: NOW },
).state;
const serialized = JSON.stringify(createSaveData(game, NOW));

describe("parseSaveData", () => {
  it("round-trips a real save", () => {
    expect(parseSaveData(serialized)?.state).toEqual({
      ...game,
      metadata: { ...game.metadata, lastSaved: NOW },
    });
  });

  it.each([
    ["nothing", null],
    ["broken JSON", "{"],
    [
      "the wrong shape",
      JSON.stringify({ version: "1.0.0", state: { hello: "world" }, timestamp: NOW }),
    ],
    ["negative gold", serialized.replace('"gold":0', '"gold":-5')],
    ["an oversized name", serialized.replace('"name":"Aria"', `"name":"${"A".repeat(500)}"`)],
  ])("returns null for %s", (_, input) => {
    expect(parseSaveData(input)).toBeNull();
  });
});

describe("importSaveFile", () => {
  it("accepts a valid save file", async () => {
    const state = await importSaveFile(new File([serialized], "save.json"));
    expect(state.character?.name).toBe("Aria");
  });

  it("rejects files over the size limit without reading them", async () => {
    const big = new File(["x".repeat(MAX_SAVE_FILE_BYTES + 1)], "save.json");
    await expect(importSaveFile(big)).rejects.toThrow("too large");
  });

  it("rejects files that are not saves", async () => {
    await expect(importSaveFile(new File(["{}"], "save.json"))).rejects.toThrow("not a valid");
  });
});
