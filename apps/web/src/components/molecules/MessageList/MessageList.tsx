import { MessageBubble } from "../../atoms/MessageBubble";
import type { MessageType } from "../../atoms/MessageBubble";
import styles from "./MessageList.module.css";

export interface Message {
  id: number | string;
  type: MessageType;
  text: string;
}

export interface MessageListProps {
  messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className={styles["message-list"]}>
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          text={msg.text}
          type={msg.type}
        />
      ))}
    </div>
  );
};


