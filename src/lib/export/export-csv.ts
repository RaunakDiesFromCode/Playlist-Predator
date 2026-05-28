import type { PlaylistMeta, VideoMetadata } from "@/types/playlist";
import type { PlaylistProgress } from "@/types/progress";

import {
    buildPlaylistExportSnapshot,
    createPlaylistExportFilename,
    escapeCsvValue,
} from "./shared";

export function buildPlaylistCsvExport({
    playlist,
    videos,
    progress,
}: {
    playlist: PlaylistMeta | null;
    videos: VideoMetadata[];
    progress: PlaylistProgress;
}) {
    const snapshot = buildPlaylistExportSnapshot({
        playlist,
        videos,
        progress,
    });

    const rows = [
        ["Title", "Status", "Duration", "Video ID"],
        ...snapshot.videos.map((video) => [
            video.title,
            video.statusLabel,
            video.durationFormatted,
            video.videoId,
        ]),
    ];

    const content = rows
        .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
        .join("\n");

    return {
        filename: createPlaylistExportFilename(
            playlist?.title ?? "playlist",
            "csv",
        ),
        mimeType: "text/csv",
        content,
    };
}
