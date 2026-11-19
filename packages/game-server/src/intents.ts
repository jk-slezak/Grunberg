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
    case "equip": {
      const slot = state.inventory.items.find((s) => s.item.id === intent.itemId);
      if (!slot) throw new IntentRejected("You don't have that item");
      return { type: "EQUIP_ITEM", payload: { item: slot.item } };
    }
    case "unequip":
      return { type: "UNEQUIP_ITEM", payload: { slot: intent.slot } };
  }
};
