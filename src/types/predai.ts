export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    createdAt: number;
}

export interface PredAIRequest {
    messages: ChatMessage[];
    playlistId: string;
}

export interface PredAIResponse {
    message: ChatMessage;
}
