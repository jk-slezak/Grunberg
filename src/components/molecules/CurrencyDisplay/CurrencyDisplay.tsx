import styles from "./CurrencyDisplay.module.css";

export interface CurrencyDisplayProps {
  amount: number;
  icon?: string;
  label?: string;
}

export const CurrencyDisplay = ({ 
  amount, 
  icon = "💰", 
  label = "złota" 
}: CurrencyDisplayProps) => {
  return (
    <div className={styles["currency-display"]}>
      <span className={styles["currency-display__icon"]}>{icon}</span>
      <span className={styles["currency-display__amount"]}>
        {amount} {label}
      </span>
    </div>
  );
};


