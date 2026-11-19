import { MapCell } from "../../atoms/MapCell";
import type { CellType } from "../../atoms/MapCell";
import styles from "./Minimap.module.css";

export interface MinimapProps {
  gridSize?: number;
  playerPosition?: { x: number; y: number };
  title?: string;
}

export const Minimap = ({
  gridSize = 200,
  playerPosition = { x: 3, y: 3 },
}: MinimapProps) => {
  const generateMinimap = () => {
    const grid = [];

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        let cellType: CellType;

        const isWall =
          y === 0 || y === gridSize - 1 || x === 0 || x === gridSize - 1;
        const isPlayer = x === playerPosition.x && y === playerPosition.y;
        const isExplored = Math.random() > 0.5;

        if (isPlayer) {
          cellType = "player";
        } else if (isWall) {
          cellType = "wall";
        } else if (isExplored) {
          cellType = "explored";
        } else {
          cellType = "unexplored";
        }

        grid.push(<MapCell key={`${x}-${y}`} type={cellType} x={x} y={y} />);
      }
    }
    return grid;
  };

  return (
    <div className={styles.minimap}>
      <div className={styles["minimap__grid"]}>{generateMinimap()}</div>
    </div>
  );
};
