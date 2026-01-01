export interface AnalyzePlaylistRequest {
    playlistUrl: string;
    completedVideos?: number;
}

export interface PlaylistAnalysis {
    totalVideos: number;
    totalDuration: string;
    averageVideoDuration: string;
    remainingVideos: number;
    remainingDuration: string;
    adjustedDurations: string[];
    adjustedRemainingDurations: string[];
}

export interface VideoMetadata {
    videoId: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    durationSeconds: number;
    durationFormatted: string;
    position: number;
}

export interface PlaylistAnalysisResponse {
    summary: PlaylistAnalysis;
    videos: VideoMetadata[];
}
