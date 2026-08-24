import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LobbyInfo, LobbyMember, JoinLobbyResponse } from "@/types/friends";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolvePlaylistUuid(
    playlistIdOrYoutubeId: string,
    userId?: string,
): Promise<string | null> {
    if (UUID_REGEX.test(playlistIdOrYoutubeId)) {
        return playlistIdOrYoutubeId;
    }

    const supabase = await createSupabaseServerClient();
    const { data: playlists } = await supabase
        .from("playlists")
        .select("id, user_id")
        .eq("youtube_playlist_id", playlistIdOrYoutubeId);

    if (!playlists || playlists.length === 0) {
        return null;
    }

    if (playlists.length === 1) {
        return playlists[0].id;
    }

    if (userId) {
        const playlistIds = playlists.map((p) => p.id);
        const { data: memberships } = await supabase
            .from("playlist_members")
            .select("playlist_id")
            .in("playlist_id", playlistIds)
            .eq("user_id", userId);

        if (memberships && memberships.length > 0) {
            return memberships[0].playlist_id;
        }

        const owned = playlists.find((p) => p.user_id === userId);
        if (owned) {
            return owned.id;
        }
    }

    return playlists[0].id;
}

export async function getLobbyInfo(
    youtubePlaylistId: string,
    totalVideos: number,
): Promise<LobbyInfo | null> {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return null;
    }

    // Query all playlists accessible by caller (owner or member) for this youtube ID
    const { data: playlists, error: playlistError } = await supabase
        .from("playlists")
        .select(
            "id, user_id, youtube_playlist_id, title, thumbnail, invite_token, invite_enabled",
        )
        .eq("youtube_playlist_id", youtubePlaylistId);

    if (playlistError || !playlists || playlists.length === 0) {
        return null;
    }

    // Determine active lobby: prefer the lobby the user joined as a member, or the one they own
    let activePlaylist = playlists[0];

    const playlistIds = playlists.map((p) => p.id);
    const { data: memberships } = await supabase
        .from("playlist_members")
        .select("playlist_id")
        .in("playlist_id", playlistIds)
        .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
        const joinedId = memberships[0].playlist_id;
        activePlaylist =
            playlists.find((p) => p.id === joinedId) ?? playlists[0];
    } else {
        const owned = playlists.find((p) => p.user_id === user.id);
        if (owned) {
            activePlaylist = owned;
        }
    }

    const isOwner = activePlaylist.user_id === user.id;

    // Fetch lobby roster via SECURITY DEFINER function
    const { data: roster, error: rosterError } = await supabase.rpc(
        "get_playlist_members",
        {
            p_playlist_id: activePlaylist.id,
        },
    );

    if (rosterError || !roster) {
        return null;
    }

    // Fetch progress for this playlist (filtered by RLS to co-members)
    const { data: progressRows } = await supabase
        .from("playlist_progress")
        .select("user_id, video_id, status, updated_at")
        .eq("playlist_id", youtubePlaylistId);

    const progressByUser = new Map<
        string,
        {
            doneCount: number;
            rewatchCount: number;
            skippedCount: number;
            lastActiveAt: string | null;
        }
    >();

    for (const row of progressRows ?? []) {
        const stats = progressByUser.get(row.user_id) ?? {
            doneCount: 0,
            rewatchCount: 0,
            skippedCount: 0,
            lastActiveAt: null,
        };

        if (row.status === "DONE") stats.doneCount += 1;
        if (row.status === "REWATCH") stats.rewatchCount += 1;
        if (row.status === "SKIP") stats.skippedCount += 1;

        if (
            row.updated_at &&
            (!stats.lastActiveAt || row.updated_at > stats.lastActiveAt)
        ) {
            stats.lastActiveAt = row.updated_at;
        }

        progressByUser.set(row.user_id, stats);
    }

    const members: LobbyMember[] = (roster as Array<{
        user_id: string;
        name: string;
        role: "owner" | "member";
        joined_at: string;
    }>).map((m) => {
        const userProgress = progressByUser.get(m.user_id) ?? {
            doneCount: 0,
            rewatchCount: 0,
            skippedCount: 0,
            lastActiveAt: null,
        };

        const safeTotal = totalVideos > 0 ? totalVideos : 0;
        const completionPercentage =
            safeTotal > 0
                ? Math.min(
                      100,
                      Math.round((userProgress.doneCount / safeTotal) * 100),
                  )
                : 0;

        return {
            userId: m.user_id,
            name: m.name || "Member",
            role: m.role,
            joinedAt: m.joined_at,
            doneCount: userProgress.doneCount,
            rewatchCount: userProgress.rewatchCount,
            skippedCount: userProgress.skippedCount,
            totalVideos: safeTotal,
            completionPercentage,
            lastActiveAt: userProgress.lastActiveAt,
        };
    });

    return {
        playlistId: activePlaylist.id,
        youtubePlaylistId: activePlaylist.youtube_playlist_id,
        title: activePlaylist.title,
        thumbnail: activePlaylist.thumbnail,
        isOwner,
        inviteToken: activePlaylist.invite_token ?? "",
        inviteEnabled: activePlaylist.invite_enabled ?? true,
        members,
    };
}

export async function joinByInvite(token: string): Promise<JoinLobbyResponse> {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Not authenticated");
    }

    const { data, error } = await supabase.rpc("join_playlist_by_invite", {
        p_token: token,
    });

    if (error || !data) {
        throw new Error(error?.message ?? "Failed to join playlist");
    }

    const result = data as {
        playlist_id: string;
        youtube_playlist_id: string;
        title: string | null;
        thumbnail: string | null;
        role: "owner" | "member";
    };

    return {
        playlistId: result.playlist_id,
        youtubePlaylistId: result.youtube_playlist_id,
        title: result.title,
        thumbnail: result.thumbnail,
        role: result.role,
    };
}

export async function regenerateInvite(playlistId: string): Promise<string> {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Not authenticated");
    }

    const dbPlaylistId = await resolvePlaylistUuid(playlistId, user.id);
    if (!dbPlaylistId) {
        throw new Error("Playlist not found");
    }

    const { data, error } = await supabase.rpc("regenerate_playlist_invite", {
        p_playlist_id: dbPlaylistId,
    });

    if (error || !data) {
        throw new Error(error?.message ?? "Failed to regenerate invite");
    }

    return data as string;
}

export async function leavePlaylist(playlistId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Not authenticated");
    }

    const dbPlaylistId = await resolvePlaylistUuid(playlistId, user.id);
    if (!dbPlaylistId) {
        throw new Error("Playlist not found");
    }

    // Check that caller is not owner trying to leave
    const { data: ownerCheck } = await supabase
        .from("playlists")
        .select("id")
        .eq("id", dbPlaylistId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (ownerCheck) {
        throw new Error("Owner cannot leave their own playlist");
    }

    const { error } = await supabase
        .from("playlist_members")
        .delete()
        .eq("playlist_id", dbPlaylistId)
        .eq("user_id", user.id);

    if (error) {
        throw new Error(error.message);
    }
}

export async function kickMember(
    playlistId: string,
    targetUserId: string,
): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Not authenticated");
    }

    if (user.id === targetUserId) {
        throw new Error("Owner cannot kick themselves");
    }

    const dbPlaylistId = await resolvePlaylistUuid(playlistId, user.id);
    if (!dbPlaylistId) {
        throw new Error("Playlist not found");
    }

    // Ensure caller is the owner
    const { data: ownerCheck } = await supabase
        .from("playlists")
        .select("id")
        .eq("id", dbPlaylistId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!ownerCheck) {
        throw new Error("Unauthorized to remove members");
    }

    const { error } = await supabase
        .from("playlist_members")
        .delete()
        .eq("playlist_id", dbPlaylistId)
        .eq("user_id", targetUserId);

    if (error) {
        throw new Error(error.message);
    }
}
