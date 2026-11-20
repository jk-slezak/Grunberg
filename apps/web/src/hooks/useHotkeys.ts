import { useEffect, useEffectEvent, useState } from "react";

export const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export interface Hotkey {
  key: string;
  onPress?: () => void;
}

export const useHotkeys = (hotkeys: Hotkey[]): string | null => {
  const [pressed, setPressed] = useState<string | null>(null);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (isTypingTarget(event.target)) return;
    const hotkey = hotkeys.find((h) => h.key.toLowerCase() === event.key.toLowerCase());
    if (!hotkey) return;
    event.preventDefault();
    hotkey.onPress?.();
    setPressed(hotkey.key);
  });
  const onKeyUp = useEffectEvent(() => setPressed(null));

  useEffect(() => {
    const down = (event: KeyboardEvent) => onKeyDown(event);
    const up = () => onKeyUp();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return pressed;
};
