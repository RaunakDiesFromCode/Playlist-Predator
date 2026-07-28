import {
    fetchPlaylistVideoIds,
    fetchVideoDetails,
    fetchPlaylistDetails,
    fetchVideoDetail,
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
import { extractChaptersFromDescription } from "./chapters";
import { parseYouTubeInput } from "./input";

export async function analyzePlaylist(
    input: AnalyzePlaylistRequest,
): Promise<PlaylistAnalysisResponse> {
    const { playlistUrl, completedVideos = 0 } = input;

    const resource = parseYouTubeInput(playlistUrl);
    if (!resource) throw new Error("Invalid YouTube URL");

    const { playlistDetails, videos } =
        resource.kind === "playlist"
            ? await analyzePlaylistResource(resource.id)
            : await analyzeVideoResource(resource.id);

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
            totalDurationSeconds / totalVideos,
        ),
        remainingVideos: totalVideos - completedSafe,
        remainingDuration: formatDuration(remainingDurationSeconds),
        adjustedDurations: calculateAdjustedDurations(totalDurationSeconds),
        adjustedRemainingDurations: calculateAdjustedDurations(
            remainingDurationSeconds,
        ),
    };

    return {
        summary,
        videos,
        playlist: playlistDetails,
    };
}

async function analyzePlaylistResource(playlistId: string) {
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
            watchUrl: `https://www.youtube.com/watch?v=${video.id}&list=${playlistId}&index=${index + 1}`,
            description: video.snippet.description ?? "",
        };
    });

    return {
        playlistDetails: {
            ...playlistDetails,
            youtubeUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
        },
        videos,
    };
}

async function analyzeVideoResource(videoId: string) {
    const video = await fetchVideoDetail(videoId);
    const durationSeconds = parseISODuration(video.contentDetails.duration);
    const thumbnail = video.snippet.thumbnails.medium?.url;

    if (!thumbnail) {
        throw new Error("Video thumbnail not found");
    }

    const chapters = extractChaptersFromDescription(
        video.snippet.description ?? "",
    );

    const markers =
        chapters.length > 0
            ? chapters
            : [{ title: video.snippet.title, startSeconds: 0 }];

    const videos: VideoMetadata[] = markers.map((chapter, index) => {
        const nextMarker = markers[index + 1];
        const endSeconds = nextMarker?.startSeconds ?? durationSeconds;
        const chapterDurationSeconds = Math.max(
            endSeconds - chapter.startSeconds,
            0,
        );

        return {
            videoId: `${video.id}-chapter-${index + 1}`,
            title: chapter.title,
            thumbnail,
            channelTitle: video.snippet.channelTitle,
            durationSeconds: chapterDurationSeconds,
            durationFormatted: formatDuration(chapterDurationSeconds),
            position: index + 1,
            watchUrl: `https://www.youtube.com/watch?v=${video.id}&t=${chapter.startSeconds}s`,
            description: video.snippet.description ?? "",
        };
    });

    return {
        playlistDetails: {
            title: video.snippet.title,
            channelTitle: video.snippet.channelTitle,
            thumbnail,
            youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        },
        videos,
    };
}
