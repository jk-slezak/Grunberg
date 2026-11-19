import type { GameState, GameStateAction } from "@grunberg/engine";
import { IntentRejected } from "./errors";
import type { Intent } from "./schemas";

const STEP = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east: { dx: 1, dy: 0 },
  west: { dx: -1, dy: 0 },
} as const;

export const intentToAction = (state: GameState, intent: Intent): GameStateAction => {
  if (!state.character) throw new IntentRejected("No character");

  switch (intent.type) {
    case "move": {
      const { dx, dy } = STEP[intent.direction];
      const { floor, x, y } = state.position;
      const target = { floor, x: x + dx, y: y + dy };
      if (!state.currentFloor) throw new IntentRejected("There is nowhere to go yet");
      const tile = state.currentFloor.tiles[target.y]?.[target.x];
      if (!tile || tile.type === "wall") throw new IntentRejected("You can't go that way");
      return { type: "UPDATE_POSITION", payload: target };
    }
    // Ownership, item type and level are checked by the engine (no effect -> 422).
    case "equip":
      return { type: "EQUIP_ITEM", payload: { itemId: intent.itemId } };
    case "unequip":
      return { type: "UNEQUIP_ITEM", payload: { slot: intent.slot } };
  }
};
