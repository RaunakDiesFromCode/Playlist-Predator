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
