import {
    fetchPlaylistVideoIds,
    fetchVideoDetails,
    fetchPlaylistDetails,
    parseISODuration,
} from "./client";
import {
    formatDuration,
    calculateAdjustedDurations,
} from "@/lib/time/duration";
import {
    AnalyzePlaylistRequest,
    PlaylistAnalysis,
    PlaylistAnalysisResponse,
    VideoMetadata,
} from "@/types/playlist";

export async function analyzePlaylist(
    input: AnalyzePlaylistRequest
): Promise<PlaylistAnalysisResponse> {
    const { playlistUrl, completedVideos = 0 } = input;

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) throw new Error("Invalid playlist URL");

    const playlistDetails = await fetchPlaylistDetails(playlistId);

    const videoIds = await fetchPlaylistVideoIds(playlistId);
    const videoData = await fetchVideoDetails(videoIds);

    const videos: VideoMetadata[] = videoData.map((video, index) => {
        const seconds = parseISODuration(video.contentDetails.duration);

        return {
            videoId: video.id,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails.medium.url,
            channelTitle: video.snippet.channelTitle,
            durationSeconds: seconds,
            durationFormatted: formatDuration(seconds),
            position: index + 1,
        };
    });

    const durations = videos.map((v) => v.durationSeconds);

    const totalDurationSeconds = durations.reduce((a, b) => a + b, 0);
    const totalVideos = videos.length;

    const completedSafe = Math.min(completedVideos, totalVideos);
    const completedDurationSeconds = durations
        .slice(0, completedSafe)
        .reduce((a, b) => a + b, 0);

    const remainingDurationSeconds =
        totalDurationSeconds - completedDurationSeconds;

    const summary: PlaylistAnalysis = {
        totalVideos,
        totalDuration: formatDuration(totalDurationSeconds),
        averageVideoDuration: formatDuration(
            totalDurationSeconds / totalVideos
        ),
        remainingVideos: totalVideos - completedSafe,
        remainingDuration: formatDuration(remainingDurationSeconds),
        adjustedDurations: calculateAdjustedDurations(totalDurationSeconds),
        adjustedRemainingDurations: calculateAdjustedDurations(
            remainingDurationSeconds
        ),
    };

    return {
        summary,
        videos,
        playlist: playlistDetails,
    };
}

function extractPlaylistId(url: string): string | null {
    try {
        return new URL(url).searchParams.get("list");
    } catch {
        return null;
    }
}
