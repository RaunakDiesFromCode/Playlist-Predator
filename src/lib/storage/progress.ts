import { PlaylistProgress, VideoStatus } from "@/types/progress";

function key(playlistId: string) {
    return `playlist-progress:${playlistId}`;
}

export function loadProgress(playlistId: string): PlaylistProgress {
    if (typeof window === "undefined") return {};
    try {
        const raw = localStorage.getItem(key(playlistId));
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export function saveProgress(playlistId: string, progress: PlaylistProgress) {
    if (typeof window === "undefined") return;
    localStorage.setItem(key(playlistId), JSON.stringify(progress));
}

export function updateVideoStatus(
    playlistId: string,
    videoId: string,
    status: VideoStatus
) {
    const progress = loadProgress(playlistId);

    progress[videoId] = { status, watched: false };

    saveProgress(playlistId, progress);

    return progress;
}
