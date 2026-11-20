import { useLayoutEffect, useRef } from "react";

export const useScrollToEnd = <T extends HTMLElement>(trigger: unknown) => {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [trigger]);
  return ref;
};
