import type { PlaylistMeta, VideoMetadata } from "@/types/playlist";
import type { PlaylistProgress, VideoStatus } from "@/types/progress";

export type PlaylistExportFormat = "json" | "csv";

export type PlaylistExportStatus = VideoStatus;

export interface PlaylistExportCounts {
    totalVideos: number;
    completedCount: number;
    skippedCount: number;
    rewatchCount: number;
    remainingCount: number;
}

export interface PlaylistExportVideo {
    videoId: string;
    title: string;
    durationSeconds: number;
    durationFormatted: string;
    position: number;
    status: PlaylistExportStatus;
    statusLabel: string;
    watchUrl?: string;
}

export interface PlaylistExportSnapshot {
    exportedAt: string;
    playlist: PlaylistMeta | null;
    counts: PlaylistExportCounts;
    videos: PlaylistExportVideo[];
}

function getStatusLabel(status: PlaylistExportStatus) {
    switch (status) {
        case "DONE":
            return "Done";
        case "REWATCH":
            return "Rewatch";
        case "SKIP":
            return "Skipped";
        default:
            return "Study";
    }
}

export function buildPlaylistExportSnapshot({
    playlist,
    videos,
    progress,
}: {
    playlist: PlaylistMeta | null;
    videos: VideoMetadata[];
    progress: PlaylistProgress;
}): PlaylistExportSnapshot {
    let completedCount = 0;
    let skippedCount = 0;
    let rewatchCount = 0;

    const exportedVideos = videos.map((video) => {
        const status = progress[video.videoId]?.status ?? "NONE";

        if (status === "DONE") {
            completedCount += 1;
        } else if (status === "REWATCH") {
            rewatchCount += 1;
        } else if (status === "SKIP") {
            skippedCount += 1;
        }

        return {
            videoId: video.videoId,
            title: video.title,
            durationSeconds: video.durationSeconds,
            durationFormatted: video.durationFormatted,
            position: video.position,
            status,
            statusLabel: getStatusLabel(status),
            watchUrl: video.watchUrl,
        };
    });

    const remainingCount = Math.max(
        videos.length - completedCount - skippedCount - rewatchCount,
        0,
    );

    return {
        exportedAt: new Date().toISOString(),
        playlist,
        counts: {
            totalVideos: videos.length,
            completedCount,
            skippedCount,
            rewatchCount,
            remainingCount,
        },
        videos: exportedVideos,
    };
}

export function createPlaylistExportFilename(
    title: string,
    format: PlaylistExportFormat,
) {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");

    return `${slug || "playlist"}-progress.${format}`;
}

export function escapeCsvValue(value: string | number | null | undefined) {
    const normalized = value == null ? "" : String(value);
    const escaped = normalized.replace(/"/g, '""');

    return `"${escaped}"`;
}
