import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DbPlaylist } from "@/types/playlist-db";

/**
 * Fetch all playlists for the currently authenticated user
 */
export async function getUserPlaylists(): Promise<DbPlaylist[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .order("updated_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data ?? [];
}

/**
 * Insert a playlist for the current user
 */
export async function createPlaylist(input: {
    youtube_playlist_id: string;
    title?: string | null;
    thumbnail?: string | null;
}): Promise<DbPlaylist> {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
        .from("playlists")
        .insert({
            user_id: user.id,
            youtube_playlist_id: input.youtube_playlist_id,
            title: input.title ?? null,
            thumbnail: input.thumbnail ?? null,
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Delete a playlist and all associated progress data for the current user.
 * Removes records from both `playlists` and `playlist_progress` tables.
 */
export async function deletePlaylist(
    youtubePlaylistId: string,
): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Not authenticated");
    }

    // Find playlist database ID to clean up conversations/messages if any
    const { data: playlist } = await supabase
        .from("playlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("youtube_playlist_id", youtubePlaylistId)
        .maybeSingle();

    if (playlist) {
        // Find conversation IDs to clean up messages
        const { data: conversations } = await supabase
            .from("predai_conversations")
            .select("id")
            .eq("playlist_id", playlist.id)
            .eq("user_id", user.id);

        if (conversations && conversations.length > 0) {
            const conversationIds = conversations.map((c) => c.id);
            await supabase
                .from("predai_messages")
                .delete()
                .in("conversation_id", conversationIds);

            await supabase
                .from("predai_conversations")
                .delete()
                .eq("playlist_id", playlist.id)
                .eq("user_id", user.id);
        }
    }

    // Delete progress rows (foreign-key-like relationship by playlist_id)
    const { error: progressError } = await supabase
        .from("playlist_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("playlist_id", youtubePlaylistId);

    if (progressError) {
        throw new Error(progressError.message);
    }

    // Delete the playlist record
    const { error: playlistError } = await supabase
        .from("playlists")
        .delete()
        .eq("user_id", user.id)
        .eq("youtube_playlist_id", youtubePlaylistId);

    if (playlistError) {
        throw new Error(playlistError.message);
    }
}
