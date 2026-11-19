// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCharacterForm } from "./useCharacterForm";

const setup = () => renderHook(() => useCharacterForm());

describe("useCharacterForm", () => {
  it("starts as a Human with all points spent, but is invalid without a name", () => {
    const { result } = setup();
    expect(result.current.remainingPoints).toBe(0);
    expect(result.current.isValid).toBe(false);
    expect(result.current.toCharacter()).toBeNull();
  });

  it("builds a normalized character once the form is valid", () => {
    const { result } = setup();
    act(() => result.current.setName("  Aria  "));
    expect(result.current.isValid).toBe(true);
    expect(result.current.toCharacter()).toMatchObject({
      name: "Aria",
      race: "Human",
      class: "Warrior",
    });
  });

  it("resets stats to the race's base when the race changes", () => {
    const { result } = setup();
    act(() => result.current.selectRace("Elf"));
    expect(result.current.stats).toEqual({ strength: 3, agility: 7, intelligence: 7 });
    expect(result.current.remainingPoints).toBe(-2);
  });

  it("keeps stats within the budget and the min/max values", () => {
    const { result } = setup();
    act(() => result.current.increaseStat("strength"));
    expect(result.current.stats.strength).toBe(5);

    act(() => result.current.decreaseStat("strength"));
    act(() => result.current.increaseStat("agility"));
    expect(result.current.stats).toMatchObject({ strength: 4, agility: 6 });

    for (let i = 0; i < 10; i++) act(() => result.current.decreaseStat("intelligence"));
    expect(result.current.stats.intelligence).toBe(1);
  });

  it("rejects names the server would reject", () => {
    const { result } = setup();
    act(() => result.current.setName("<script>"));
    expect(result.current.isValid).toBe(false);
  });
});
