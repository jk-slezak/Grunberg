import { useCallback, useRef, useState } from "react";
import type { ChatMessage, MessageDraft } from "../chat/types";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    type: "narration",
    text: "Witaj w Mglistej Wieży. Światło pochodni rzuca tańczące cienie na kamienne ściany.",
  },
];

export const MAX_MESSAGES = 200;

export const useChatMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const nextId = useRef(INITIAL_MESSAGES.length + 1);

  const append = useCallback((drafts: readonly MessageDraft[]) => {
    if (drafts.length === 0) return;
    const added = drafts.map((draft) => ({ ...draft, id: nextId.current++ }));
    setMessages((current) => [...current, ...added].slice(-MAX_MESSAGES));
  }, []);

  return { messages, append };
};
