import { loadProgress as loadLocal, saveProgress } from "@/lib/storage/progress";
import { updateVideoStatus as updateLocal } from "@/lib/storage/progress";
import { VideoStatus, PlaylistProgress } from "@/types/progress";
import { supabase } from "@/lib/supabase/client";

export async function loadProgress(
    playlistId: string
): Promise<PlaylistProgress> {
    const { data } = await supabase.auth.getUser();

    // Guest → localStorage
    if (!data.user) {
        return loadLocal(playlistId);
    }

    // Logged in → DB
    const res = await fetch(`/api/progress?playlistId=${playlistId}`);

    if (!res.ok) {
        // fallback safety
        return loadLocal(playlistId);
    }

    return res.json();
}

export async function updateVideoStatus(
    playlistId: string,
    current: PlaylistProgress,
    videoId: string,
    status: VideoStatus
) {
    const next = { ...current };

    if (status === "NONE") {
        delete next[videoId];
    } else {
        next[videoId] = { status };
    }

    // Persist (DB or local)
    await persistProgress(playlistId, videoId, status);

    return next;
}

async function persistProgress(
    playlistId: string,
    videoId: string,
    status: VideoStatus
) {
    const { data } = await supabase.auth.getUser();

    // Guest → localStorage
    if (!data.user) {
        await saveProgress(playlistId, {});
        return;
    }

    // Logged-in → DB
    await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId, videoId, status }),
    });
}


