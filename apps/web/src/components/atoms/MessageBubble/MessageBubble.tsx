import styles from "./MessageBubble.module.css";

import type { MessageType } from "../../../chat/types";

export interface MessageBubbleProps {
  text: string;
  type: MessageType;
  animate?: boolean;
}

export const MessageBubble = ({ text, type, animate = true }: MessageBubbleProps) => {
  const classes = [
    styles["message-bubble"],
    styles[`message-bubble--${type}`],
    animate ? styles["message-bubble--animated"] : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{text}</div>;
};
