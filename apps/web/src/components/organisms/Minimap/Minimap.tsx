import type { CSSProperties } from "react";
import type { DungeonFloor, MapTile, Position } from "@grunberg/engine";
import { MapCell, type CellType } from "../../atoms/MapCell";
import styles from "./Minimap.module.css";

export interface MinimapProps {
  floor: DungeonFloor | null;
  position: Position;
  viewSize?: number;
}

const cellType = (tile: MapTile | undefined): CellType => {
  if (!tile?.explored) return "unexplored";
  if (tile.type === "wall") return "wall";
  if (tile.type === "stairs_down") return "stairs";
  return "explored";
};

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
