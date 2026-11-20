import type { ChatMessage } from "../../../chat/types";
import { ChatInput } from "../../molecules/ChatInput";
import { MessageList } from "../../molecules/MessageList";
import styles from "./Chat.module.css";

export interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const Chat = ({ messages, onSendMessage }: ChatProps) => (
  <div className={styles.chat}>
    <MessageList messages={messages} />
    <ChatInput
      placeholder="Wciśnij Enter, wpisz komendę (np. północ) lub chodź strzałkami"
      onSendMessage={onSendMessage}
    />
  </div>
);
