import type { Direction, Intent } from "@grunberg/engine";

// A Map, not an object: player text must never reach prototype keys like "constructor".
const DIRECTION_WORDS = new Map<string, Direction>([
  ["n", "north"],
  ["north", "north"],
  ["północ", "north"],
  ["polnoc", "north"],
  ["s", "south"],
  ["south", "south"],
  ["południe", "south"],
  ["poludnie", "south"],
  ["e", "east"],
  ["east", "east"],
  ["wschód", "east"],
  ["wschod", "east"],
  ["w", "west"],
  ["west", "west"],
  ["zachód", "west"],
  ["zachod", "west"],
]);

/** Filler words players type before a direction: "idź na północ", "go north". */
const FILLER = new Set(["idź", "idz", "na", "go", "move", "walk"]);

/** Turns a chat command into an intent, or null if it isn't one the game understands. */
export const parseCommand = (text: string): Intent | null => {
  const words = text
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => !FILLER.has(word));
  if (words.length !== 1) return null;
  const direction = DIRECTION_WORDS.get(words[0]);
  return direction ? { type: "move", direction } : null;
};

export const COMMAND_HELP =
  "Nie rozumiem. Spróbuj: północ, południe, wschód, zachód (albo strzałki).";
