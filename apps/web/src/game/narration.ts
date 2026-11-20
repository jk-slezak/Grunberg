import type { Direction, GameEvent, Intent } from "@grunberg/engine";
import type { MessageDraft } from "../chat/types";

const DIRECTION_NAMES: Record<Direction, string> = {
  north: "północ",
  south: "południe",
  east: "wschód",
  west: "zachód",
};

/** Rejection codes from the engine and the server, in the player's words. */
const REJECTIONS = new Map<string, string>([
  ["blocked", "Ściana. Tędy nie przejdziesz."],
  ["no_floor", "Nie ma jeszcze dokąd iść."],
  ["no_character", "Najpierw stwórz postać."],
  ["no_effect", "Nic się nie dzieje."],
  ["length_limit", "Ta wyprawa osiągnęła swój limit. Zacznij nową grę."],
]);

const narration = (text: string): MessageDraft => ({ type: "narration", text });
export const systemMessage = (text: string): MessageDraft => ({ type: "system", text });

/** What the player's character does, written before the result is known. */
export const describeIntent = (intent: Intent): MessageDraft => {
  switch (intent.type) {
    case "move":
      return { type: "action", text: `Idziesz na ${DIRECTION_NAMES[intent.direction]}.` };
    case "equip":
      return { type: "action", text: "Sięgasz po przedmiot." };
    case "unequip":
      return { type: "action", text: "Zdejmujesz przedmiot." };
  }
};

export const describeRejection = (reason: string | undefined): MessageDraft =>
  systemMessage(REJECTIONS.get(reason ?? "") ?? "Nie da się tego zrobić.");

/**
 * Engine events as story lines. Events that the minimap or HUD already show (a step, revealed
 * tiles) stay silent, so the chat doesn't fill with noise.
 */
export const narrateEvent = (event: GameEvent): MessageDraft | null => {
  switch (event.type) {
    case "FLOOR_CHANGED":
      return narration(`Wkraczasz na piętro ${event.data.newFloor}. Mgła gęstnieje.`);
    case "ITEM_EQUIPPED":
      return narration("Przedmiot leży jak ulał.");
    case "ITEM_UNEQUIPPED":
      return narration("Odkładasz przedmiot do plecaka.");
    default:
      return null;
  }
};

export const narrateEvents = (events: readonly GameEvent[]): MessageDraft[] =>
  events.map(narrateEvent).filter((m): m is MessageDraft => m !== null);
