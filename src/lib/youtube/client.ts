const API_BASE = "https://www.googleapis.com/youtube/v3";

const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
    throw new Error("Missing YOUTUBE_API_KEY");
}

// ── YouTube API response types ──────────────────────────────────────────────

interface PlaylistItemSnippet {
    contentDetails: { videoId: string };
}

interface PlaylistItemsResponse {
    items: PlaylistItemSnippet[];
    nextPageToken?: string;
}

interface VideoContentDetails {
    duration: string;
}

interface VideoSnippet {
    title: string;
    channelTitle: string;
    thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
    };
    description?: string;
    publishedAt?: string;
}

interface VideoItem {
    id: string;
    contentDetails: VideoContentDetails;
    snippet: VideoSnippet;
}

interface VideosResponse {
    items: VideoItem[];
}

interface PlaylistSnippet {
    title: string;
    channelTitle: string;
    thumbnails: {
        medium?: { url: string };
        default: { url: string };
        high: { url: string };
    };
}

interface PlaylistDetailsResponse {
    items: { snippet: PlaylistSnippet }[];
}

// ── API functions ───────────────────────────────────────────────────────────

export async function fetchPlaylistVideoIds(
    playlistId: string,
): Promise<string[]> {
    const videoIds: string[] = [];
    let pageToken: string | undefined;

    do {
        const res = await fetch(
            `${API_BASE}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50&key=${API_KEY}&pageToken=${
                pageToken ?? ""
            }`,
        );

        const data = (await res.json()) as PlaylistItemsResponse;

        for (const item of data.items) {
            videoIds.push(item.contentDetails.videoId);
        }

        pageToken = data.nextPageToken;
    } while (pageToken);

    return videoIds;
}

export async function fetchVideoDurations(
    videoIds: string[],
): Promise<number[]> {
    const durations: number[] = [];

    for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50);

        const res = await fetch(
            `${API_BASE}/videos?part=contentDetails&id=${chunk.join(
                ",",
            )}&key=${API_KEY}`,
        );

        const data = (await res.json()) as VideosResponse;

        for (const item of data.items) {
            durations.push(parseISODuration(item.contentDetails.duration));
        }
    }

    return durations;
}

export async function fetchVideoDetails(videoIds: string[]): Promise<VideoItem[]> {
    const videos: VideoItem[] = [];

    for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50);

        const res = await fetch(
            `${API_BASE}/videos?part=contentDetails,snippet&id=${chunk.join(
                ",",
            )}&key=${API_KEY}`,
        );

        const data = (await res.json()) as VideosResponse & {
            error?: { message: string };
        };

        if (!data.items) {
            throw new Error(
                data.error?.message || "Failed to fetch video details",
            );
        }

        videos.push(...data.items);
    }

    return videos;
}

export async function fetchVideoDetail(videoId: string) {
    const [video] = await fetchVideoDetails([videoId]);

    if (!video) {
        throw new Error("Video not found");
    }

    return video;
}

export async function fetchPlaylistDetails(playlistId: string) {
    const res = await fetch(
        `${API_BASE}/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`,
    );

    const data = (await res.json()) as PlaylistDetailsResponse;

    if (!data.items || data.items.length === 0) {
        throw new Error("Playlist not found");
    }

    const { snippet } = data.items[0];

    return {
        title: snippet.title,
        channelTitle: snippet.channelTitle,
        thumbnail: snippet.thumbnails.medium?.url,
    };
}

export function parseISODuration(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    return (
        (match?.[1] ? +match[1] * 3600 : 0) +
        (match?.[2] ? +match[2] * 60 : 0) +
        (match?.[3] ? +match[3] : 0)
    );
}
