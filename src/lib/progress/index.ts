import {
    loadProgress as loadLocal,
    saveProgress,
} from "@/lib/storage/progress";
import { VideoStatus, PlaylistProgress } from "@/types/progress";
import { supabase } from "@/lib/supabase/client";

function mergeProgress(
    remote: PlaylistProgress,
    local: PlaylistProgress,
): PlaylistProgress {
    const merged: PlaylistProgress = { ...remote };

    for (const [videoId, localProgress] of Object.entries(local)) {
        const remoteProgress = merged[videoId];

        if (!remoteProgress) {
            merged[videoId] = localProgress;
            continue;
        }

        const remoteTime = remoteProgress.updatedAt
            ? new Date(remoteProgress.updatedAt).getTime()
            : 0;
        const localTime = localProgress.updatedAt
            ? new Date(localProgress.updatedAt).getTime()
            : 0;

        if (localTime >= remoteTime) {
            merged[videoId] = localProgress;
        }
    }

    return merged;
}

export async function loadProgress(
    playlistId: string,
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

    const remote = (await res.json()) as PlaylistProgress;
    return mergeProgress(remote, loadLocal(playlistId));
}

export async function updateVideoStatus(
    playlistId: string,
    current: PlaylistProgress,
    videoId: string,
    status: VideoStatus,
) {
    const next = { ...current };

    if (status === "NONE") {
        delete next[videoId];
    } else {
        next[videoId] = {
            status,
            updatedAt: new Date().toISOString(),
        };
    }

    // Persist (DB or local)
    void persistProgress(playlistId, next, videoId, status).catch(() => {});

    return next;
}

async function persistProgress(
    playlistId: string,
    next: PlaylistProgress,
    videoId: string,
    status: VideoStatus,
) {
    const { data } = await supabase.auth.getUser();

    // Guest → localStorage
    if (!data.user) {
        saveProgress(playlistId, next);
        return;
    }

    // Cache locally for logged-in users too, so the UI can recover if the
    // server write is rejected or delayed.
    saveProgress(playlistId, next);

    // Logged-in → DB
    const response = await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId, videoId, status }),
    });

    if (!response.ok) {
        // Keep the local cache so refreshes still reflect the latest choice.
        return;
    }
}
