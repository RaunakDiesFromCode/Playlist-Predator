type UserPlaylistRow = {
    youtube_playlist_id: string;
};

type UserProgressRow = {
    playlist_id: string;
    status: string;
    updated_at: string | null;
};

export type UserStats = {
    playlistsTracked: number;
    videosCompleted: number;
    videosSkipped: number;
    videosRewatch: number;
    totalTrackedVideos: number;
    lastActivity: Date | null;
};

function normalizeStatus(status: string) {
    return status.trim().toUpperCase();
}

function parseDate(value: string | null): Date | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateUserStats({
    playlists,
    progressRows,
}: {
    playlists: UserPlaylistRow[];
    progressRows: UserProgressRow[];
}): UserStats {
    const trackedPlaylists = new Set<string>();

    for (const playlist of playlists) {
        if (playlist.youtube_playlist_id) {
            trackedPlaylists.add(playlist.youtube_playlist_id);
        }
    }

    let videosCompleted = 0;
    let videosSkipped = 0;
    let videosRewatch = 0;
    let lastActivity: Date | null = null;

    for (const row of progressRows) {
        if (row.playlist_id) {
            trackedPlaylists.add(row.playlist_id);
        }

        const normalizedStatus = normalizeStatus(row.status);

        if (normalizedStatus === "DONE") {
            videosCompleted += 1;
        } else if (normalizedStatus === "SKIP") {
            videosSkipped += 1;
        } else if (normalizedStatus === "REWATCH") {
            videosRewatch += 1;
        }

        const updatedAt = parseDate(row.updated_at);

        if (
            updatedAt &&
            (!lastActivity || updatedAt.getTime() > lastActivity.getTime())
        ) {
            lastActivity = updatedAt;
        }
    }

    return {
        playlistsTracked: trackedPlaylists.size,
        videosCompleted,
        videosSkipped,
        videosRewatch,
        totalTrackedVideos: progressRows.length,
        lastActivity,
    };
}
