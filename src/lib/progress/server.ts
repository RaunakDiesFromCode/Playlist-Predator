import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PlaylistProgress } from "@/types/progress";

export async function loadServerProgress(
    playlistId: string,
): Promise<PlaylistProgress> {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {};
    }

    const { data, error } = await supabase
        .from("playlist_progress")
        .select("video_id, status, updated_at")
        .eq("playlist_id", playlistId)
        .eq("user_id", user.id);

    if (error || !data) {
        return {};
    }

    const progress: PlaylistProgress = {};

    for (const row of data) {
        progress[row.video_id] = {
            status: row.status,
            updatedAt: row.updated_at ?? undefined,
        };
    }

    return progress;
}
