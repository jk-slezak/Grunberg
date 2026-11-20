import { MessageBubble } from "../../atoms/MessageBubble";
import type { ChatMessage } from "../../../chat/types";
import { useScrollToEnd } from "../../../hooks/useScrollToEnd";
import styles from "./MessageList.module.css";

export interface MessageListProps {
  messages: ChatMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  const listRef = useScrollToEnd<HTMLDivElement>(messages);

  return (
    <div ref={listRef} className={styles["message-list"]} role="log" aria-label="Dziennik gry">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} text={msg.text} type={msg.type} />
      ))}
    </div>
  );
};
