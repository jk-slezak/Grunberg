import styles from "./Label.module.css";

export interface LabelProps {
  children: React.ReactNode;
  size?: "small" | "medium" | "large";
  variant?: "default" | "uppercase";
  className?: string;
}

export const Label = ({ 
  children, 
  size = "medium", 
  variant = "default",
  className = "" 
}: LabelProps) => {
  const classes = [
    styles.label,
    styles[`label--${size}`],
    styles[`label--${variant}`],
    className
  ].filter(Boolean).join(" ");

  return <span className={classes}>{children}</span>;
};


