import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "small" | "medium" | "large";
  icon?: ReactNode;
  children: ReactNode;
}

export const Button = ({ 
  variant = "primary", 
  size = "medium",
  icon,
  children,
  className = "",
  ...props 
}: ButtonProps) => {
  const classes = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    className
  ].filter(Boolean).join(" ");

  return (
    <button className={classes} {...props}>
      {icon && <span className={styles.button__icon}>{icon}</span>}
      <span className={styles.button__content}>{children}</span>
    </button>
  );
};


