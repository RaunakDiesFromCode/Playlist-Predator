import { createClient } from "@supabase/supabase-js";

type PlaylistRow = {
    id: string;
    user_id: string;
    youtube_playlist_id: string;
    title: string | null;
    thumbnail: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type ProgressRow = {
    id: string;
    user_id: string;
    playlist_id: string;
    video_id: string;
    status: string;
    updated_at: string | null;
};

type StatusCount = {
    status: string;
    count: number;
};

type UserCount = {
    userId: string;
    playlists: number;
    progressEvents: number;
    email: string | null;
    name: string | null;
    role: string;
};

export type AdminDashboardData = {
    playlists: PlaylistRow[];
    progressRows: ProgressRow[];
    totals: {
        playlists: number;
        progressRows: number;
        users: number;
        activeUsersLast7Days: number;
    };
    statusBreakdown: StatusCount[];
    userBreakdown: UserCount[];
};

function createSupabaseAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        );
    }

    return createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

function getRecentWindowIso(days: number) {
    const now = new Date();
    now.setDate(now.getDate() - days);
    return now.toISOString();
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
    const supabase = createSupabaseAdminClient();

    const [playlistsResult, progressResult, usersResult] = await Promise.all([
        supabase
            .from("playlists")
            .select(
                "id, user_id, youtube_playlist_id, title, thumbnail, created_at, updated_at",
            )
            .order("updated_at", { ascending: false }),
        supabase
            .from("playlist_progress")
            .select("id, user_id, playlist_id, video_id, status, updated_at")
            .order("updated_at", { ascending: false }),
        supabase.auth.admin.listUsers(),
    ]);

    if (playlistsResult.error) {
        throw new Error(playlistsResult.error.message);
    }

    if (progressResult.error) {
        throw new Error(progressResult.error.message);
    }

    if (usersResult.error) {
        throw new Error(usersResult.error.message);
    }

    const playlists = (playlistsResult.data ?? []) as PlaylistRow[];
    const progressRows = (progressResult.data ?? []) as ProgressRow[];
    const users = usersResult.data.users ?? [];

    const usersById = new Map(
        users.map((user) => {
            const metadataName =
                typeof user.user_metadata?.name === "string"
                    ? user.user_metadata.name
                    : null;

            const metadataRole =
                (typeof user.app_metadata?.role === "string"
                    ? user.app_metadata.role
                    : null) ??
                (typeof user.user_metadata?.role === "string"
                    ? user.user_metadata.role
                    : null) ??
                "user";

            return [
                user.id,
                {
                    email: user.email ?? null,
                    name: metadataName,
                    role: metadataRole,
                },
            ];
        }),
    );

    const userSet = new Set<string>();
    const activeUserSet = new Set<string>();
    const statusMap = new Map<string, number>();
    const userStats = new Map<string, UserCount>();
    const last7DaysIso = getRecentWindowIso(7);

    for (const row of playlists) {
        userSet.add(row.user_id);

        const stats = userStats.get(row.user_id) ?? {
            userId: row.user_id,
            playlists: 0,
            progressEvents: 0,
            email: usersById.get(row.user_id)?.email ?? null,
            name: usersById.get(row.user_id)?.name ?? null,
            role: usersById.get(row.user_id)?.role ?? "user",
        };

        stats.playlists += 1;
        userStats.set(row.user_id, stats);

        if (row.updated_at && row.updated_at >= last7DaysIso) {
            activeUserSet.add(row.user_id);
        }
    }

    for (const row of progressRows) {
        userSet.add(row.user_id);

        const normalizedStatus = row.status || "UNKNOWN";
        statusMap.set(
            normalizedStatus,
            (statusMap.get(normalizedStatus) ?? 0) + 1,
        );

        const stats = userStats.get(row.user_id) ?? {
            userId: row.user_id,
            playlists: 0,
            progressEvents: 0,
            email: usersById.get(row.user_id)?.email ?? null,
            name: usersById.get(row.user_id)?.name ?? null,
            role: usersById.get(row.user_id)?.role ?? "user",
        };

        stats.progressEvents += 1;
        userStats.set(row.user_id, stats);

        if (row.updated_at && row.updated_at >= last7DaysIso) {
            activeUserSet.add(row.user_id);
        }
    }

    const statusBreakdown = [...statusMap.entries()]
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

    const userBreakdown = [...userStats.values()].sort((a, b) => {
        if (b.progressEvents !== a.progressEvents) {
            return b.progressEvents - a.progressEvents;
        }

        return b.playlists - a.playlists;
    });

    return {
        playlists,
        progressRows,
        totals: {
            playlists: playlists.length,
            progressRows: progressRows.length,
            users: userSet.size,
            activeUsersLast7Days: activeUserSet.size,
        },
        statusBreakdown,
        userBreakdown,
    };
}
