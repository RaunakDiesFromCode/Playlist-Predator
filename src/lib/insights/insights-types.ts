export type PlaylistInsights = {
    playlistId: string;
    title: string | null;
    thumbnail: string | null;
    trackedVideos: number;
    completedVideos: number;
    skippedVideos: number;
    rewatchVideos: number;
    completionRate: number;
    lastActivity: Date | null;
};

export type InsightsOverview = {
    playlistsTracked: number;
    videosCompleted: number;
    videosSkipped: number;
    videosRewatch: number;
    videosRemaining: number;
    totalTrackedVideos: number;
    completionRate: number;
    lastActivity: Date | null;
};

export type ProgressBreakdown = {
    done: number;
    skip: number;
    rewatch: number;
    remaining: number;
};

export type ActivityItem = {
    playlistId: string;
    playlistTitle: string | null;
    videoId: string;
    status: "DONE" | "SKIP" | "REWATCH";
    timestamp: Date;
};

export type LearningSummary = {
    topPlaylist: PlaylistInsights | null;
    mostActivePlaylist: PlaylistInsights | null;
    totalTrackedVideos: number;
    overallCompletionRate: number;
    videosRemaining: number;
};
