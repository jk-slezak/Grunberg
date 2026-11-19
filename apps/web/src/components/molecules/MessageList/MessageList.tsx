import { MessageBubble } from "../../atoms/MessageBubble";
import type { ChatMessage } from "../../../chat/types";
import styles from "./MessageList.module.css";

export interface MessageListProps {
  messages: ChatMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className={styles["message-list"]}>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} text={msg.text} type={msg.type} />
      ))}
    </div>
  );
};
