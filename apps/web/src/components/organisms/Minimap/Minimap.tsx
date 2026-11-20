import type { CSSProperties } from "react";
import type { DungeonFloor, MapTile, Position } from "@grunberg/engine";
import { MapCell, type CellType } from "../../atoms/MapCell";
import styles from "./Minimap.module.css";

export interface MinimapProps {
  floor: DungeonFloor | null;
  position: Position;
  /** Tiles per side of the window around the player. Odd, so the player sits in the middle. */
  viewSize?: number;
}

const cellType = (tile: MapTile | undefined): CellType => {
  // Fog of war: tiles the player hasn't seen look the same as the void beyond the map.
  if (!tile?.explored) return "unexplored";
  if (tile.type === "wall") return "wall";
  if (tile.type === "stairs_down") return "stairs";
  return "explored";
};

/** The part of the floor around the player, always centered on them. */
export const Minimap = ({ floor, position, viewSize = 15 }: MinimapProps) => {
  const half = Math.floor(viewSize / 2);
  const cells = [];
  for (let row = 0; row < viewSize; row++) {
    for (let col = 0; col < viewSize; col++) {
      const x = position.x - half + col;
      const y = position.y - half + row;
      const isPlayer = x === position.x && y === position.y;
      cells.push(
        <MapCell
          key={`${col}-${row}`}
          type={isPlayer ? "player" : cellType(floor?.tiles[y]?.[x])}
        />,
      );
    }
  }

  return (
    <div
      className={styles.minimap}
      role="img"
      aria-label={`Minimapa: piętro ${position.floor}, pozycja ${position.x}, ${position.y}`}
    >
      <div
        className={styles["minimap__grid"]}
        style={{ "--minimap-size": viewSize } as CSSProperties}
        aria-hidden="true"
      >
        {cells}
      </div>
    </div>
  );
};
