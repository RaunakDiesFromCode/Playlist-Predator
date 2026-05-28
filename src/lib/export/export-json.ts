import type { PlaylistMeta, VideoMetadata } from "@/types/playlist";
import type { PlaylistProgress } from "@/types/progress";

import {
    buildPlaylistExportSnapshot,
    createPlaylistExportFilename,
} from "./shared";

export function buildPlaylistJsonExport({
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

    const payload = {
        exportedAt: snapshot.exportedAt,
        playlist: snapshot.playlist,
        counts: snapshot.counts,
        videos: snapshot.videos,
    };

    return {
        filename: createPlaylistExportFilename(
            playlist?.title ?? "playlist",
            "json",
        ),
        mimeType: "application/json",
        content: JSON.stringify(payload, null, 2),
    };
}
