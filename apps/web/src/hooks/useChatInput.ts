import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { isTypingTarget } from "./useHotkeys";

export const useChatInput = (onSend: (message: string) => void) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const message = value.trim();
    if (!message) return;
    onSend(message);
    setValue("");
  };

  useEffect(() => {
    const focusOnEnter = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Enter" || isTypingTarget(e.target)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", focusOnEnter);
    return () => document.removeEventListener("keydown", focusOnEnter);
  }, []);

  return { value, onChange, onKeyDown, inputRef };
};
