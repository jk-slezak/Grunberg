import styles from "./MapCell.module.css";

export type CellType = "wall" | "explored" | "unexplored" | "stairs" | "player";

export interface MapCellProps {
  type: CellType;
}

export const MapCell = ({ type }: MapCellProps) => (
  <div className={`${styles["map-cell"]} ${styles[`map-cell--${type}`]}`} />
);
