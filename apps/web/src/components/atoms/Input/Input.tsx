import React, { type InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "dark";
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ variant = "default", error = false, className = "", ...props }, ref) => {
    const classes = [
      styles.input,
      styles[`input--${variant}`],
      error ? styles["input--error"] : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <input
        className={classes}
        ref={ref} // Assign the forwarded ref here.
        {...props}
      />
    );
  }
);

Input.displayName = "Input"; // Add a display name for better debugging.
