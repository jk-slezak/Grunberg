// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionButtonGroup } from "../components/organisms/ActionButtonGroup";
import { SkillBar } from "../components/organisms/SkillBar";
import { useHotkeys } from "./useHotkeys";

afterEach(cleanup);

const press = (key: string, target: Window | Element = window) =>
  act(() => {
    fireEvent.keyDown(target, { key });
  });

describe("useHotkeys", () => {
  it("runs the bound action and reports the held key until it is released", () => {
    const onPress = vi.fn();
    const { result } = renderHook(() => useHotkeys([{ key: "Q", onPress }]));

    press("q");
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(result.current).toBe("Q");

    act(() => {
      fireEvent.keyUp(window, { key: "q" });
    });
    expect(result.current).toBeNull();
  });

  it("ignores keys while the player is typing in a text field", () => {
    const onPress = vi.fn();
    renderHook(() => useHotkeys([{ key: "1", onPress }]));
    const input = document.createElement("input");
    document.body.appendChild(input);

    press("1", input);

    expect(onPress).not.toHaveBeenCalled();
    input.remove();
  });

  it("uses the latest actions without re-registering, and stops after unmount", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(({ onPress }) => useHotkeys([{ key: "1", onPress }]), {
      initialProps: { onPress: first },
    });

    rerender({ onPress: second });
    press("1");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    unmount();
    press("1");
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("lets two components bind different keys without overwriting each other", () => {
    const attack = vi.fn();
    const quests = vi.fn();
    render(
      <>
        <SkillBar skills={[{ id: 1, name: "Attack", hotKey: "1", icon: null, onClick: attack }]} />
        <ActionButtonGroup
          buttons={[{ id: 1, label: "Quests", icon: null, hotKey: "Q", onClick: quests }]}
        />
      </>,
    );

    press("1");
    press("Q");
    expect(attack).toHaveBeenCalledTimes(1);
    expect(quests).toHaveBeenCalledTimes(1);
  });
});
