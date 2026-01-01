export interface VideoProgress {
    watched: boolean;
}

export type PlaylistProgress = Record<string, VideoProgress>;
