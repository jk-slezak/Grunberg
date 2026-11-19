import styles from "./MessageBubble.module.css";

export type MessageType = "narration" | "action" | "dialogue" | "system";

export interface MessageBubbleProps {
  text: string;
  type: MessageType;
  animate?: boolean;
}

export const MessageBubble = ({ 
  text, 
  type, 
  animate = true 
}: MessageBubbleProps) => {
  const classes = [
    styles["message-bubble"],
    styles[`message-bubble--${type}`],
    animate ? styles["message-bubble--animated"] : ""
  ].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      {text}
    </div>
  );
};


