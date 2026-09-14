import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    LobbyInfo,
    LobbyMember,
    JoinLobbyResponse,
    VideoCrewMember,
} from "@/types/friends";

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

    // 1 & 2 in parallel: Fetch user memberships and playlists matching youtubePlaylistId
    const [userMembershipsRes, playlistsRes] = await Promise.all([
        supabase
            .from("playlist_members")
            .select("playlist_id")
            .eq("user_id", user.id),
        supabase
            .from("playlists")
            .select(
                "id, user_id, youtube_playlist_id, title, thumbnail, invite_token, invite_enabled",
            )
            .eq("youtube_playlist_id", youtubePlaylistId),
    ]);

    const userMemberships = userMembershipsRes.data;
    const playlists = playlistsRes.data ?? [];

    let activePlaylist: {
        id: string;
        user_id: string;
        youtube_playlist_id: string;
        title: string | null;
        thumbnail: string | null;
        invite_token?: string | null;
        invite_enabled?: boolean | null;
    } | null = null;

    if (userMemberships && userMemberships.length > 0) {
        const joinedPlaylistIds = new Set(
            userMemberships.map((m) => m.playlist_id),
        );
        activePlaylist =
            playlists.find((p) => joinedPlaylistIds.has(p.id)) ?? null;

        // If the joined playlist wasn't in playlists query (e.g. filtered by RLS), fetch it by id
        if (!activePlaylist) {
            const { data: joinedPlaylists } = await supabase
                .from("playlists")
                .select(
                    "id, user_id, youtube_playlist_id, title, thumbnail, invite_token, invite_enabled",
                )
                .in("id", Array.from(joinedPlaylistIds))
                .eq("youtube_playlist_id", youtubePlaylistId)
                .limit(1);

            if (joinedPlaylists && joinedPlaylists.length > 0) {
                activePlaylist = joinedPlaylists[0];
            }
        }
    }

    // 2. Check if user owns one of the matching playlists
    if (!activePlaylist) {
        activePlaylist = playlists.find((p) => p.user_id === user.id) ?? null;
    }

    // 3. Fallback to any matching playlist
    if (!activePlaylist && playlists.length > 0) {
        activePlaylist = playlists[0];
    }

    // 4. Auto-create if none exists at all
    if (!activePlaylist) {
        const { data: createdPlaylist } = await supabase
            .from("playlists")
            .insert({
                user_id: user.id,
                youtube_playlist_id: youtubePlaylistId,
            })
            .select(
                "id, user_id, youtube_playlist_id, title, thumbnail, invite_token, invite_enabled",
            )
            .single();

        if (createdPlaylist) {
            activePlaylist = createdPlaylist;
        }
    }

    if (!activePlaylist) {
        return null;
    }

    const isOwner = activePlaylist.user_id === user.id;

    // Run roster fetch and progress fetch in PARALLEL
    const [rosterRes, progressRes] = await Promise.all([
        supabase.rpc("get_playlist_members", {
            p_playlist_id: activePlaylist.id,
        }),
        supabase
            .from("playlist_progress")
            .select("user_id, video_id, status, updated_at")
            .eq("playlist_id", youtubePlaylistId),
    ]);

    const roster = rosterRes.data;
    const progressRows = progressRes.data;

    let rosterList: Array<{
        user_id: string;
        name: string;
        avatar_url?: string | null;
        role: "owner" | "member";
        joined_at: string;
    }> = Array.isArray(roster)
        ? (roster as Array<{
              user_id: string;
              name: string;
              avatar_url?: string | null;
              role: "owner" | "member";
              joined_at: string;
          }>)
        : [];

    // Ensure the host/owner is always present in rosterList
    const hasOwner = rosterList.some(
        (m) => m.role === "owner" || m.user_id === activePlaylist.user_id,
    );
    if (!hasOwner) {
        const ownerName = isOwner
            ? user.user_metadata?.name || user.email?.split("@")[0] || "Host"
            : "Host";
        const ownerAvatar = isOwner
            ? user.user_metadata?.avatar_url || user.user_metadata?.picture || null
            : null;

        rosterList.unshift({
            user_id: activePlaylist.user_id,
            name: ownerName,
            avatar_url: ownerAvatar,
            role: "owner",
            joined_at: new Date().toISOString(),
        });
    }

    // Ensure current user is present if they belong to this playlist
    const hasCurrentUser = rosterList.some((m) => m.user_id === user.id);
    if (
        !hasCurrentUser &&
        (isOwner ||
            userMemberships?.some((m) => m.playlist_id === activePlaylist.id))
    ) {
        const myName =
            user.user_metadata?.name || user.email?.split("@")[0] || "You";
        const myAvatar =
            user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        rosterList.push({
            user_id: user.id,
            name: myName,
            avatar_url: myAvatar,
            role: isOwner ? "owner" : "member",
            joined_at: new Date().toISOString(),
        });
    }

    // Attach caller avatar if present
    rosterList = rosterList.map((m) => {
        if (m.user_id === user.id) {
            return {
                ...m,
                avatar_url:
                    m.avatar_url ||
                    user.user_metadata?.avatar_url ||
                    user.user_metadata?.picture ||
                    null,
            };
        }
        return m;
    });

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

    const rosterMap = new Map<
        string,
        {
            userId: string;
            name: string;
            avatarUrl?: string | null;
            role: "owner" | "member";
        }
    >();
    for (const m of rosterList) {
        rosterMap.set(m.user_id, {
            userId: m.user_id,
            name: m.name || "Member",
            avatarUrl: m.avatar_url || null,
            role: m.role,
        });
    }

    const videoCompletions: Record<string, VideoCrewMember[]> = {};

    for (const row of progressRows ?? []) {
        if (row.status === "DONE") {
            const member = rosterMap.get(row.user_id);
            if (member) {
                if (!videoCompletions[row.video_id]) {
                    videoCompletions[row.video_id] = [];
                }
                if (
                    !videoCompletions[row.video_id].some(
                        (existing) => existing.userId === member.userId,
                    )
                ) {
                    videoCompletions[row.video_id].push({
                        userId: member.userId,
                        name: member.name,
                        avatarUrl: member.avatarUrl ?? null,
                        role: member.role,
                        completedAt: row.updated_at,
                    });
                }
            }
        }
    }

    for (const videoId in videoCompletions) {
        videoCompletions[videoId].sort((a, b) => {
            if (a.role === "owner" && b.role !== "owner") return -1;
            if (b.role === "owner" && a.role !== "owner") return 1;
            return a.name.localeCompare(b.name);
        });
    }

    const members: LobbyMember[] = rosterList.map((m) => {
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
            avatarUrl: m.avatar_url ?? null,
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
        videoCompletions,
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
