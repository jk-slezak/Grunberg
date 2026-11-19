import { useEffect, useEffectEvent, useState } from "react";

/** True when a key press belongs to text the user is typing (inputs, textareas, editable content). */
export const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** A key (case-insensitive) and what it does. */
export interface Hotkey {
  key: string;
  onPress?: () => void;
}

/**
 * Binds keys to actions while the component is mounted. Keys pressed while typing in a text field
 * are ignored. Returns the key of the hotkey currently held down, or null.
 */
export const useHotkeys = (hotkeys: Hotkey[]): string | null => {
  const [pressed, setPressed] = useState<string | null>(null);

  // Effect events always see the latest hotkeys, so the listeners are added only once.
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
