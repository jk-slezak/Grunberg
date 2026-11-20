import { useMemo, useSyncExternalStore } from "react";
import { parseSession, readRawSession } from "../services/session";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

export const useSavedGame = () => {
  const raw = useSyncExternalStore(subscribe, readRawSession, () => null);
  return useMemo(() => {
    const session = parseSession(raw);
    return { hasSave: session !== null, savedAt: session?.savedAt ?? null };
  }, [raw]);
};
