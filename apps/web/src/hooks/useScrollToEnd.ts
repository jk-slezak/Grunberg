import { useLayoutEffect, useRef } from "react";

/**
 * Keeps a scrollable element scrolled to its end whenever `trigger` changes (e.g. a new chat
 * message). Runs before paint, so the newest content never flashes out of view.
 */
export const useScrollToEnd = <T extends HTMLElement>(trigger: unknown) => {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [trigger]);
  return ref;
};
