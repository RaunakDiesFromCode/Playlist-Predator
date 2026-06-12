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

// ── Context Builder Types ──────────────────────────────────────────────────

export interface PlaylistContext {
    title: string;
    channelTitle: string;
    totalVideos: number;
    completedVideos: number;
    skippedVideos: number;
    remainingVideos: number;
    totalDuration: string;
    remainingDuration: string;
}

export interface VideoContextItem {
    position: number;
    title: string;
    duration: string;
    status: "completed" | "skipped" | "remaining";
}

export interface VideoContext {
    items: VideoContextItem[];
}

export interface AnalysisContext {
    topics: string[];
    difficulty: "beginner" | "intermediate" | "advanced" | "mixed";
    skillsCovered: string[];
    prerequisites: string[];
    summary: string;
}

export interface StudyPlannerContext {
    preferredSpeed: number;
    dailyStudyMinutes: number;
    estimatedDaysToComplete: number;
    estimatedCompletionDate: string | null;
}

export interface PredAIContext {
    playlist: PlaylistContext;
    videos: VideoContext;
    analysis: AnalysisContext;
    planner: StudyPlannerContext;
}

// ── Search Integration Types ───────────────────────────────────────────────

export interface SearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
}

export interface SearchDecision {
    shouldSearch: boolean;
    query: string;
    reason: string;
}

// ── RAG Types (future) ─────────────────────────────────────────────────────

export interface TranscriptChunk {
    id: string;
    videoId: string;
    videoTitle: string;
    position: number;
    startTime: number;
    endTime: number;
    content: string;
    embedding: number[];
}

export interface RAGResult {
    chunks: TranscriptChunk[];
    similarity: number;
}
