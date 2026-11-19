import { useChatInput } from "../../../hooks/useChatInput";
import { Input } from "../../atoms/Input";
import styles from "./ChatInput.module.css";

export interface ChatInputProps {
  placeholder?: string;
  onSendMessage: (message: string) => void;
}

export const ChatInput = ({ placeholder = "Wpisz komendę...", onSendMessage }: ChatInputProps) => {
  const { value, onChange, onKeyDown, inputRef } = useChatInput(onSendMessage);

  return (
    <div className={styles["chat-input"]}>
      <Input
        variant="dark"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Chat input"
        ref={inputRef}
      />
    </div>
  );
};
