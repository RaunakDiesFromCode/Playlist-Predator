import { VideoMetadata } from "@/types/playlist";
import { PlaylistProgress, VideoStatus } from "@/types/progress";

export type ResumeStrategy =
    | "first-unfinished"
    | "first-skipped"
    | "first-rewatch"
    | "first-item"
    | "last-played";

export interface PlaylistResumeTarget {
    video: VideoMetadata;
    href: string;
    remainingCount: number;
    remainingDurationSeconds: number;
    isComplete: boolean;
    strategy: ResumeStrategy;
}

function buildVideoHref(video: VideoMetadata) {
    return video.watchUrl ?? `https://www.youtube.com/watch?v=${video.videoId}`;
}

function isMatch(status: VideoStatus | undefined, strategy: ResumeStrategy) {
    if (strategy === "first-skipped") {
        return status === "SKIP";
    }

    if (strategy === "first-rewatch") {
        return status === "REWATCH";
    }

    return false;
}

export function getPlaylistResumeTarget(
    videos: VideoMetadata[],
    progress: PlaylistProgress,
    strategy: ResumeStrategy = "first-unfinished",
): PlaylistResumeTarget | null {
    if (videos.length === 0) {
        return null;
    }

    const unfinishedVideos = videos.filter((video) => {
        const status = progress[video.videoId]?.status;
        return status !== "DONE";
    });

    const remainingCount = unfinishedVideos.length;
    const remainingDurationSeconds = unfinishedVideos.reduce(
        (sum, video) => sum + video.durationSeconds,
        0,
    );
    const isComplete = remainingCount === 0;

    let targetVideo: VideoMetadata | undefined;

    switch (strategy) {
        case "first-item":
            targetVideo = videos[0];
            break;
        case "last-played": {
            let latestTime = -1;

            for (const video of videos) {
                const updatedAt = progress[video.videoId]?.updatedAt;
                if (!updatedAt) continue;

                const timestamp = new Date(updatedAt).getTime();
                if (Number.isNaN(timestamp)) continue;

                if (timestamp > latestTime) {
                    latestTime = timestamp;
                    targetVideo = video;
                }
            }

            break;
        }
        default:
            targetVideo = unfinishedVideos[0] ?? videos[0];
            break;
    }

    if (!targetVideo) {
        return null;
    }

    if (strategy === "first-skipped" || strategy === "first-rewatch") {
        const matched = videos.find((video) => {
            const status = progress[video.videoId]?.status;
            return isMatch(status, strategy);
        });

        targetVideo = matched ?? targetVideo;
    }

    return {
        video: targetVideo,
        href: buildVideoHref(targetVideo),
        remainingCount,
        remainingDurationSeconds,
        isComplete,
        strategy,
    };
}
