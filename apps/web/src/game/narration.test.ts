import { describe, expect, it } from "vitest";
import { describeIntent, describeRejection, narrateEvents } from "./narration";

describe("narration", () => {
  it("describes a step in the player's language", () => {
    expect(describeIntent({ type: "move", direction: "north" })).toEqual({
      type: "action",
      text: "Idziesz na północ.",
    });
  });

  it("explains rejection codes and falls back for unknown ones", () => {
    expect(describeRejection("blocked").text).toBe("Ściana. Tędy nie przejdziesz.");
    expect(describeRejection("constructor").text).toBe("Nie da się tego zrobić.");
    expect(describeRejection(undefined).text).toBe("Nie da się tego zrobić.");
  });

  it("narrates story events and keeps routine ones silent", () => {
    expect(
      narrateEvents([
        { type: "POSITION_CHANGED", data: { floor: 1, x: 1, y: 1 } },
        { type: "TILES_REVEALED", data: { floor: 1, count: 3 } },
        { type: "FLOOR_CHANGED", data: { oldFloor: 1, newFloor: 2 } },
      ]),
    ).toEqual([{ type: "narration", text: "Wkraczasz na piętro 2. Mgła gęstnieje." }]);
  });
});
