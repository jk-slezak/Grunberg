import styles from "./MapCell.module.css";

export type CellType = "wall" | "explored" | "unexplored" | "player";

export interface MapCellProps {
  type: CellType;
  x?: number;
  y?: number;
}

export const MapCell = ({ type, x, y }: MapCellProps) => {
  const className = `${styles["map-cell"]} ${styles[`map-cell--${type}`]}`;
  
  return <div className={className} data-x={x} data-y={y} />;
};


