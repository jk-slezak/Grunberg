import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "../chat/types";

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 1, type: "narration", text: "Witaj w Mglistej Wieży..." },
  { id: 2, type: "action", text: "Rozglądasz się wokół." },
  {
    id: 3,
    type: "narration",
    text: "Przed tobą rozciąga się długi korytarz. Światło pochodni rzuca tańczące cienie na kamienne ściany.",
  },
];

export const useChatMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const nextId = useRef(INITIAL_MESSAGES.length + 1);

  const sendMessage = useCallback((text: string) => {
    const message: ChatMessage = { id: nextId.current++, type: "action", text };
    setMessages((current) => [...current, message]);
  }, []);

  return { messages, sendMessage };
};
