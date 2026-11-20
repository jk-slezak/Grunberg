/** Chat data shared by hooks and components (components render it, hooks produce it). */
export type MessageType = "narration" | "action" | "dialogue" | "system";

export interface ChatMessage {
  id: number | string;
  type: MessageType;
  text: string;
}

/** A message before the chat gives it an id. */
export type MessageDraft = Omit<ChatMessage, "id">;
