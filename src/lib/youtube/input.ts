export type YouTubeInputKind = "playlist" | "video";

export type YouTubeInput = {
    kind: YouTubeInputKind;
    id: string;
};

function normalizeHost(hostname: string) {
    return hostname.replace(/^www\./, "").replace(/^m\./, "");
}

export function parseYouTubeInput(value: string): YouTubeInput | null {
    const trimmed = value.trim();

    if (!trimmed) return null;

    if (!trimmed.includes("://")) {
        if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;

        return {
            kind: trimmed.length === 11 ? "video" : "playlist",
            id: trimmed,
        };
    }

    try {
        const url = new URL(trimmed);
        const host = normalizeHost(url.hostname);

        if (host === "youtu.be") {
            const videoId = url.pathname.split("/").filter(Boolean)[0];

            return videoId
                ? {
                      kind: "video",
                      id: videoId,
                  }
                : null;
        }

        if (host !== "youtube.com" && !host.endsWith(".youtube.com")) {
            return null;
        }

        const playlistId = url.searchParams.get("list");
        if (playlistId) {
            return {
                kind: "playlist",
                id: playlistId,
            };
        }

        const videoIdFromQuery = url.searchParams.get("v");
        if (videoIdFromQuery) {
            return {
                kind: "video",
                id: videoIdFromQuery,
            };
        }

        const pathnameMatch = url.pathname.match(
            /^\/(shorts|embed)\/([^/?#]+)/,
        );

        if (pathnameMatch?.[2]) {
            return {
                kind: "video",
                id: pathnameMatch[2],
            };
        }

        return null;
    } catch {
        return null;
    }
}
