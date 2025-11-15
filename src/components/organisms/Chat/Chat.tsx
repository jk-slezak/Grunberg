import { useState } from "react";
import { MessageList } from "../../molecules/MessageList";
import type { Message } from "../../molecules/MessageList";
import { ChatInput } from "../../molecules/ChatInput";
import styles from "./Chat.module.css";

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: "narration", text: "Witaj w Mglistej Wieży..." },
    { id: 2, type: "action", text: "Rozglądasz się wokół." },
    {
      id: 3,
      type: "narration",
      text: "Przed tobą rozciąga się długi korytarz. Światło pochodni rzuca tańczące cienie na kamienne ściany.",
    },
  ]);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now(),
      type: "action",
      text,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <div className={styles.chat}>
      <MessageList messages={messages} />
      <ChatInput
        placeholder="Wciśnij Enter by zacząć pisać i wysłać komendę"
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};
