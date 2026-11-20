// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatInput } from "../components/molecules/ChatInput";
import { MAX_MESSAGES, useChatMessages } from "./useChatMessages";

afterEach(cleanup);

describe("useChatMessages", () => {
  it("appends messages with unique ids, even when sent in the same tick", () => {
    const { result } = renderHook(() => useChatMessages());
    const before = result.current.messages.length;

    act(() => {
      result.current.append([{ type: "action", text: "look" }]);
      result.current.append([{ type: "action", text: "go north" }]);
    });

    const added = result.current.messages.slice(before);
    expect(added.map((m) => m.text)).toEqual(["look", "go north"]);
    expect(new Set(result.current.messages.map((m) => m.id)).size).toBe(
      result.current.messages.length,
    );
  });

  it("keeps only the newest messages", () => {
    const { result } = renderHook(() => useChatMessages());
    const drafts = Array.from({ length: MAX_MESSAGES + 5 }, (_, i) => ({
      type: "action" as const,
      text: `step ${i}`,
    }));

    act(() => result.current.append(drafts));

    expect(result.current.messages).toHaveLength(MAX_MESSAGES);
    expect(result.current.messages.at(-1)?.text).toBe(`step ${MAX_MESSAGES + 4}`);
  });
});

describe("ChatInput (useChatInput)", () => {
  const setup = () => {
    const onSend = vi.fn();
    render(<ChatInput onSendMessage={onSend} />);
    return { onSend, input: screen.getByLabelText("Chat input") as HTMLInputElement };
  };

  it("sends a trimmed message exactly once per Enter and clears the field", () => {
    const { onSend, input } = setup();
    input.focus();
    fireEvent.change(input, { target: { value: "  look around  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("look around");
    expect(input.value).toBe("");
  });

  it("does not send empty messages", () => {
    const { onSend, input } = setup();
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("focuses the chat on Enter anywhere else, without sending", () => {
    const { onSend, input } = setup();
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(document.activeElement).toBe(input);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not steal focus from another text field", () => {
    setup();
    const other = document.createElement("input");
    document.body.appendChild(other);
    other.focus();
    fireEvent.keyDown(other, { key: "Enter" });
    expect(document.activeElement).toBe(other);
    other.remove();
  });
});
