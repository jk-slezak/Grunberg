import { useChatMessages } from "../../../hooks/useChatMessages";
import { ChatInput } from "../../molecules/ChatInput";
import { MessageList } from "../../molecules/MessageList";
import styles from "./Chat.module.css";

export const Chat = () => {
  const { messages, sendMessage } = useChatMessages();

  return (
    <div className={styles.chat}>
      <MessageList messages={messages} />
      <ChatInput
        placeholder="Wciśnij Enter by zacząć pisać i wysłać komendę"
        onSendMessage={sendMessage}
      />
    </div>
  );
};
