import { DbPlaylist } from "@/types/playlist-db";

export const SIDEBAR_PLAYLISTS_UPDATED_EVENT = "sidebar:playlists-updated";

const playlistCache = new Map<string, DbPlaylist[]>();
const playlistRequestCache = new Map<string, Promise<DbPlaylist[]>>();

function playlistKey(playlist: DbPlaylist) {
    return playlist.youtube_playlist_id;
}

function dispatchPlaylistsUpdated(userId: string) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
        new CustomEvent(SIDEBAR_PLAYLISTS_UPDATED_EVENT, {
            detail: { userId },
        }),
    );
}

export function getCachedSidebarPlaylists(userId: string) {
    return playlistCache.get(userId) ?? null;
}

export function setCachedSidebarPlaylists(
    userId: string,
    playlists: DbPlaylist[],
) {
    playlistCache.set(userId, playlists);
    dispatchPlaylistsUpdated(userId);
}

export function mergeSidebarPlaylists(
    current: DbPlaylist[],
    incoming: DbPlaylist[],
) {
    const seen = new Set<string>();
    const merged: DbPlaylist[] = [];

    for (const playlist of current) {
        const key = playlistKey(playlist);
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(playlist);
    }

    for (const playlist of incoming) {
        const key = playlistKey(playlist);
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(playlist);
    }

    return merged;
}

export function upsertSidebarPlaylist(userId: string, playlist: DbPlaylist) {
    const current = playlistCache.get(userId) ?? [];
    const withoutMatch = current.filter(
        (item) => playlistKey(item) !== playlistKey(playlist),
    );

    playlistCache.set(userId, [playlist, ...withoutMatch]);
    dispatchPlaylistsUpdated(userId);
}

export function getSidebarPlaylistRequest(userId: string) {
    return playlistRequestCache.get(userId) ?? null;
}

export function setSidebarPlaylistRequest(
    userId: string,
    request: Promise<DbPlaylist[]>,
) {
    playlistRequestCache.set(userId, request);
}

export function clearSidebarPlaylistRequest(userId: string) {
    playlistRequestCache.delete(userId);
}
