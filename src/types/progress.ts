export type VideoStatus = "NONE" | "DONE" | "SKIP";

export interface VideoProgress {
    // watched: boolean;
    status: VideoStatus;
}

export type PlaylistProgress = Record<string, VideoProgress>;
