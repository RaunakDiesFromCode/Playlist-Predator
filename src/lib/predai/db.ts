import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChatMessage } from "@/types/predai";

export async function getOrCreateConversation(
    youtubePlaylistId: string,
    userId: string,
) {
    const supabase = await createSupabaseServerClient();

    const { data: playlist, error: playlistError } = await supabase
        .from("playlists")
        .select("id")
        .eq("youtube_playlist_id", youtubePlaylistId)
        .eq("user_id", userId)
        .single();

    if (playlistError || !playlist) {
        throw new Error("Playlist not found");
    }

    const playlistDbId = playlist.id;

    const { data: existing } = await supabase
        .from("predai_conversations")
        .select("id")
        .eq("playlist_id", playlistDbId)
        .eq("user_id", userId)
        .maybeSingle();

    if (existing) {
        return existing.id;
    }

    const { data, error } = await supabase
        .from("predai_conversations")
        .insert({
            playlist_id: playlistDbId,
            user_id: userId,
        })
        .select("id")
        .single();

    if (error) {
        throw error;
    }

    return data.id;
}

export async function loadMessages(
    conversationId: string,
): Promise<ChatMessage[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("predai_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.created_at).getTime(),
    }));
}

export async function saveMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("predai_messages").insert({
        conversation_id: conversationId,
        role,
        content,
    });

    if (error) throw error;
}
