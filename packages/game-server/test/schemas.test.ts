import { describe, expect, it } from "vitest";
import { actionBody, characterSchema } from "../src";

const valid = {
  name: "Aria",
  race: "Elf",
  gender: false,
  class: "Mage",
  stats: { strength: 3, agility: 5, intelligence: 7 },
};

describe("characterSchema", () => {
  it("accepts a character built by the rules and normalizes the name", () => {
    expect(characterSchema.parse({ ...valid, name: "  Jean-Luc  " }).name).toBe("Jean-Luc");
  });

  it.each([
    [
      "stats over budget (10/10/10)",
      { ...valid, stats: { strength: 10, agility: 10, intelligence: 10 } },
    ],
    ["stats under budget", { ...valid, stats: { strength: 1, agility: 1, intelligence: 1 } }],
    ["an empty name", { ...valid, name: "   " }],
    ["a 21-character name", { ...valid, name: "A".repeat(21) }],
    ["a name with markup", { ...valid, name: "<script>" }],
    ["a name with a zero-width space", { ...valid, name: "Ar\u200Bia" }],
    ["double spaces", { ...valid, name: "Ar  ia" }],
    ["an unknown class", { ...valid, class: "Necromancer" }],
  ])("rejects %s", (_, input) => {
    expect(characterSchema.safeParse(input).success).toBe(false);
  });
});

describe("actionBody", () => {
  it("bounds item ids and versions", () => {
    expect(
      actionBody.safeParse({
        expectedVersion: 0,
        intent: { type: "equip", itemId: "x".repeat(65) },
      }).success,
    ).toBe(false);
    expect(
      actionBody.safeParse({
        expectedVersion: 2_000_000,
        intent: { type: "move", direction: "east" },
      }).success,
    ).toBe(false);
  });
});
