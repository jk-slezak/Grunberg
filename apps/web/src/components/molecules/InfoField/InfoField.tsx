import { Label } from "../../atoms/Label";
import styles from "./InfoField.module.css";

export interface InfoFieldProps {
  label: string;
  value: string | number;
  valueColor?: string;
}

export const InfoField = ({ label, value, valueColor = "#e0e0e0" }: InfoFieldProps) => {
  return (
    <div className={styles["info-field"]}>
      <Label size="small" variant="uppercase">{label}</Label>
      <span className={styles["info-field__value"]} style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  );
};


