// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { useSaveFilePicker } from "./useSaveFilePicker";

const pick = (file?: File) => {
  const input = document.createElement("input");
  Object.defineProperty(input, "files", { value: file ? [file] : [] });
  input.value = "";
  return { target: input } as unknown as ChangeEvent<HTMLInputElement>;
};

describe("useSaveFilePicker", () => {
  it("loads the picked file", async () => {
    const onLoad = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useSaveFilePicker(onLoad));
    const file = new File(["{}"], "save.json");

    await act(() => result.current.onFileChange(pick(file)));

    expect(onLoad).toHaveBeenCalledWith(file);
    expect(result.current.error).toBeNull();
  });

  it("shows the load error to the player and clears it on the next attempt", async () => {
    const onLoad = vi
      .fn()
      .mockRejectedValueOnce(new Error("This is not a valid Grunberg save file"));
    const { result } = renderHook(() => useSaveFilePicker(onLoad));

    await act(() => result.current.onFileChange(pick(new File(["x"], "bad.json"))));
    expect(result.current.error).toBe("This is not a valid Grunberg save file");

    onLoad.mockResolvedValueOnce(undefined);
    await act(() => result.current.onFileChange(pick(new File(["{}"], "good.json"))));
    expect(result.current.error).toBeNull();
  });

  it("does nothing when the picker is cancelled", async () => {
    const onLoad = vi.fn();
    const { result } = renderHook(() => useSaveFilePicker(onLoad));
    await act(() => result.current.onFileChange(pick()));
    expect(onLoad).not.toHaveBeenCalled();
  });
});
