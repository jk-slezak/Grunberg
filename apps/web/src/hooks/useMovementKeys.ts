import type { Direction, Intent } from "@grunberg/engine";
import { useHotkeys } from "./useHotkeys";

const KEYS: [string, Direction][] = [
  ["ArrowUp", "north"],
  ["ArrowDown", "south"],
  ["ArrowRight", "east"],
  ["ArrowLeft", "west"],
  ["w", "north"],
  ["s", "south"],
  ["d", "east"],
  ["a", "west"],
];

export const useMovementKeys = (onMove: (intent: Intent) => void): void => {
  useHotkeys(
    KEYS.map(([key, direction]) => ({ key, onPress: () => onMove({ type: "move", direction }) })),
  );
};
