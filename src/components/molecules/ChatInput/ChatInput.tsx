import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Input } from "../../atoms/Input";
import styles from "./ChatInput.module.css";

export interface ChatInputProps {
  placeholder?: string;
  onSendMessage: (message: string) => void;
}

export const ChatInput = ({ 
  placeholder = "Wpisz komendę...", 
  onSendMessage 
}: ChatInputProps) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (value.trim()) {
      onSendMessage(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        } else if (document.activeElement === inputRef.current) {
          handleSend();
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [handleSend]); // Re-run effect if handleSend changes.

  return (
    <div className={styles["chat-input"]}>
      <Input
        variant="dark"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Chat input"
        ref={inputRef}
      />
    </div>
  );
};


