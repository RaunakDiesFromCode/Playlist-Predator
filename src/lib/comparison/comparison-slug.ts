import { parseYouTubeInput } from "@/lib/youtube/input";

const MAX_COMPARE_PLAYLISTS = 4;

export function parseComparisonSlug(slug: string): string[] {
    return decodeURIComponent(slug)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, MAX_COMPARE_PLAYLISTS);
}

export function buildComparisonSlug(inputs: string[]): string {
    return inputs
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, MAX_COMPARE_PLAYLISTS)
        .join(",");
}

export function getComparisonPlaylistIds(inputs: string[]): string[] {
    const playlistIds: string[] = [];

    for (const value of inputs) {
        const parsed = parseYouTubeInput(value);

        if (!parsed || parsed.kind !== "playlist") {
            return [];
        }

        playlistIds.push(parsed.id);
    }

    return playlistIds.slice(0, MAX_COMPARE_PLAYLISTS);
}
