import type {
    ActivityItem,
    InsightsOverview,
    LearningSummary,
    PlaylistInsights,
    ProgressBreakdown,
} from "./insights-types";

export type PlaylistRow = {
    youtube_playlist_id: string;
    title?: string | null;
    thumbnail?: string | null;
};

export type ProgressRow = {
    playlist_id: string;
    video_id: string;
    status: string;
    updated_at: string | null;
};

export type InsightsInput = {
    playlists: PlaylistRow[];
    progressRows: ProgressRow[];
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

function latestDate(a: Date | null, b: Date | null): Date | null {
    if (!a) return b;
    if (!b) return a;
    return a.getTime() >= b.getTime() ? a : b;
}

export function calculateOverview(input: InsightsInput): InsightsOverview {
    const { progressRows } = input;
    const trackedPlaylists = new Set<string>();
    let videosCompleted = 0;
    let videosSkipped = 0;
    let videosRewatch = 0;
    let lastActivity: Date | null = null;

    for (const playlist of input.playlists) {
        if (playlist.youtube_playlist_id) {
            trackedPlaylists.add(playlist.youtube_playlist_id);
        }
    }

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

    const totalTrackedVideos = progressRows.length;
    const categorized = videosCompleted + videosSkipped + videosRewatch;
    const videosRemaining = Math.max(totalTrackedVideos - categorized, 0);
    const completionRate =
        totalTrackedVideos === 0
            ? 0
            : Math.round((videosCompleted / totalTrackedVideos) * 100);

    return {
        playlistsTracked: trackedPlaylists.size,
        videosCompleted,
        videosSkipped,
        videosRewatch,
        videosRemaining,
        totalTrackedVideos,
        completionRate,
        lastActivity,
    };
}

export function calculateProgressBreakdown(
    input: InsightsInput,
): ProgressBreakdown {
    let done = 0;
    let skip = 0;
    let rewatch = 0;

    for (const row of input.progressRows) {
        const status = normalizeStatus(row.status);
        if (status === "DONE") done += 1;
        else if (status === "SKIP") skip += 1;
        else if (status === "REWATCH") rewatch += 1;
    }

    const remaining = Math.max(
        input.progressRows.length - done - skip - rewatch,
        0,
    );

    return { done, skip, rewatch, remaining };
}

export function calculatePlaylistRankings(
    input: InsightsInput,
): PlaylistInsights[] {
    const playlistMap = new Map<string, PlaylistRow>();
    for (const pl of input.playlists) {
        playlistMap.set(pl.youtube_playlist_id, pl);
    }

    const statsMap = new Map<
        string,
        {
            tracked: number;
            completed: number;
            skipped: number;
            rewatch: number;
            lastActivity: Date | null;
        }
    >();

    for (const row of input.progressRows) {
        const existing = statsMap.get(row.playlist_id) ?? {
            tracked: 0,
            completed: 0,
            skipped: 0,
            rewatch: 0,
            lastActivity: null,
        };

        existing.tracked += 1;
        const status = normalizeStatus(row.status);
        if (status === "DONE") existing.completed += 1;
        else if (status === "SKIP") existing.skipped += 1;
        else if (status === "REWATCH") existing.rewatch += 1;

        const rowDate = parseDate(row.updated_at);
        existing.lastActivity = latestDate(existing.lastActivity, rowDate);

        statsMap.set(row.playlist_id, existing);
    }

    for (const [playlistId] of playlistMap) {
        if (!statsMap.has(playlistId)) {
            statsMap.set(playlistId, {
                tracked: 0,
                completed: 0,
                skipped: 0,
                rewatch: 0,
                lastActivity: null,
            });
        }
    }

    const result: PlaylistInsights[] = [];

    for (const [playlistId, stats] of statsMap) {
        const pl = playlistMap.get(playlistId);
        const completionRate =
            stats.tracked === 0
                ? 0
                : Math.round((stats.completed / stats.tracked) * 100);

        result.push({
            playlistId,
            title: pl?.title ?? null,
            thumbnail: pl?.thumbnail ?? null,
            trackedVideos: stats.tracked,
            completedVideos: stats.completed,
            skippedVideos: stats.skipped,
            rewatchVideos: stats.rewatch,
            completionRate,
            lastActivity: stats.lastActivity,
        });
    }

    result.sort((a, b) => b.completionRate - a.completionRate);

    return result;
}

export function calculateRecentActivity(
    input: InsightsInput,
    limit = 10,
): ActivityItem[] {
    const playlistMap = new Map<string, PlaylistRow>();
    for (const pl of input.playlists) {
        playlistMap.set(pl.youtube_playlist_id, pl);
    }

    const rows = input.progressRows
        .filter((row) => row.updated_at)
        .map((row) => ({
            ...row,
            parsedDate: parseDate(row.updated_at),
        }))
        .filter(
            (row): row is ProgressRow & { parsedDate: Date } =>
                row.parsedDate !== null,
        )
        .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime())
        .slice(0, limit);

    return rows.map((row) => {
        const normalizedStatus = normalizeStatus(row.status);
        return {
            playlistId: row.playlist_id,
            playlistTitle:
                playlistMap.get(row.playlist_id)?.title ?? null,
            videoId: row.video_id,
            status:
                normalizedStatus === "DONE" ||
                normalizedStatus === "SKIP" ||
                normalizedStatus === "REWATCH"
                    ? normalizedStatus
                    : "DONE",
            timestamp: row.parsedDate,
        };
    });
}

export function calculateLearningSummary(
    overview: InsightsOverview,
    rankings: PlaylistInsights[],
): LearningSummary {
    const sortedByCompletion = [...rankings].sort(
        (a, b) => b.completionRate - a.completionRate,
    );
    const sortedByActivity = [...rankings].sort(
        (a, b) => b.trackedVideos - a.trackedVideos,
    );

    return {
        topPlaylist: sortedByCompletion[0] ?? null,
        mostActivePlaylist: sortedByActivity[0] ?? null,
        totalTrackedVideos: overview.totalTrackedVideos,
        overallCompletionRate: overview.completionRate,
        videosRemaining: overview.videosRemaining,
    };
}
