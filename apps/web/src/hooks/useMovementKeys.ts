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

/** Arrow keys and WASD walk the player (ignored while typing in the chat). */
export const useMovementKeys = (onMove: (intent: Intent) => void) =>
  useHotkeys(
    KEYS.map(([key, direction]) => ({ key, onPress: () => onMove({ type: "move", direction }) })),
  );
