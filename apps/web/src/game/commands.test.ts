import { describe, expect, it } from "vitest";
import { parseCommand } from "./commands";

describe("parseCommand", () => {
  it.each([
    ["północ", "north"],
    ["  Idź na Zachód ", "west"],
    ["go east", "east"],
    ["s", "south"],
    ["idz na poludnie", "south"], // typed without Polish diacritics
    ["Południe", "south"],
    ["wschód", "east"], // decomposed ó (NFD) still counts
  ])("%s → %s", (text, direction) => {
    expect(parseCommand(text)).toEqual(direction ? { type: "move", direction } : null);
  });

  it.each(["", "look around", "constructor", "__proto__", "toString", "north east"])(
    "does not turn %j into an intent",
    (text) => {
      expect(parseCommand(text)).toBeNull();
    },
  );
});
