const API_BASE = "https://www.googleapis.com/youtube/v3";

const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
    throw new Error("Missing YOUTUBE_API_KEY");
}

export async function fetchPlaylistVideoIds(
    playlistId: string
): Promise<string[]> {
    const videoIds: string[] = [];
    let pageToken: string | undefined;

    do {
        const res = await fetch(
            `${API_BASE}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50&key=${API_KEY}&pageToken=${
                pageToken ?? ""
            }`
        );

        const data = await res.json();
        console.log("playlistItems response:", data);

        videoIds.push(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...data.items.map((item: any) => item.contentDetails.videoId)
        );

        pageToken = data.nextPageToken;
    } while (pageToken);

    return videoIds;
}

export async function fetchVideoDurations(
    videoIds: string[]
): Promise<number[]> {
    const durations: number[] = [];

    for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50);

        const res = await fetch(
            `${API_BASE}/videos?part=contentDetails&id=${chunk.join(
                ","
            )}&key=${API_KEY}`
        );

        const data = await res.json();

        for (const item of data.items) {
            durations.push(parseISODuration(item.contentDetails.duration));
        }
    }

    return durations;
}

export async function fetchVideoDetails(videoIds: string[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const videos: any[] = [];

    for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50);

        const res = await fetch(
            `${API_BASE}/videos?part=contentDetails,snippet&id=${chunk.join(
                ","
            )}&key=${API_KEY}`
        );

        const data = await res.json();

        if (!data.items) {
            throw new Error(
                data.error?.message || "Failed to fetch video details"
            );
        }

        videos.push(...data.items);
    }

    return videos;
}


export function parseISODuration(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    return (
        (match?.[1] ? +match[1] * 3600 : 0) +
        (match?.[2] ? +match[2] * 60 : 0) +
        (match?.[3] ? +match[3] : 0)
    );
}
