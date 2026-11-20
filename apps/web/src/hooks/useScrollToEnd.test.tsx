// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "../chat/types";
import { MessageList } from "../components/molecules/MessageList";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const messages = (count: number): ChatMessage[] =>
  Array.from({ length: count }, (_, i) => ({ id: i, type: "narration", text: `line ${i}` }));

describe("useScrollToEnd (MessageList)", () => {
  it("scrolls the chat to the newest message whenever one is added", () => {
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(500);

    const { rerender } = render(<MessageList messages={messages(1)} />);
    const log = screen.getByRole("log");
    log.scrollTop = 0;

    rerender(<MessageList messages={messages(2)} />);

    expect(log.scrollTop).toBe(500);
  });
});
