export type MessageType = "narration" | "action" | "dialogue" | "system";

export interface ChatMessage {
  id: number | string;
  type: MessageType;
  text: string;
}

export type MessageDraft = Omit<ChatMessage, "id">;
