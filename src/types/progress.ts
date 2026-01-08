export type VideoStatus = "DONE" | "STUDY" | "REWATCH" | "SKIP";

export interface VideoProgress {
    watched: boolean;
    status: VideoStatus;
}

export type PlaylistProgress = Record<string, VideoProgress>;
