// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SkillBar, type Skill } from "../components/organisms/SkillBar/SkillBar";

afterEach(cleanup);

const setup = () => {
  const attack = vi.fn();
  const skills: Skill[] = [{ id: 1, name: "Attack", hotKey: "1", icon: null, onClick: attack }];
  render(<SkillBar skills={skills} />);
  return { attack };
};

describe("SkillBar (useSkillHotkeys)", () => {
  it("uses a skill when its hotkey is pressed", () => {
    const { attack } = setup();
    act(() => {
      fireEvent.keyDown(window, { key: "1" });
    });
    expect(attack).toHaveBeenCalledTimes(1);
  });

  it("ignores hotkeys while the player is typing in a text field", () => {
    const { attack } = setup();
    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "1" });
    expect(attack).not.toHaveBeenCalled();
    input.remove();
  });

  it("stops listening after unmount", () => {
    const { attack } = setup();
    cleanup();
    fireEvent.keyDown(window, { key: "1" });
    expect(attack).not.toHaveBeenCalled();
    expect(screen.queryByText("Attack")).toBeNull();
  });
});
