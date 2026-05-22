export type VideoStatus = "NONE" | "DONE" | "REWATCH" | "SKIP";

export interface VideoProgress {
    status: VideoStatus;
    updatedAt?: string;
}

export type PlaylistProgress = Record<string, VideoProgress>;
