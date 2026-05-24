import type { Metadata } from "next";
import { headers } from "next/headers";
import { analyzePlaylist } from "@/lib/youtube/playlist";
import { fetchPlaylistDetails } from "@/lib/youtube/client";
import { loadServerProgress } from "@/lib/progress/server";
import type { PlaylistAnalysisResponse } from "@/types/playlist";
import type { PlaylistProgress } from "@/types/progress";
import PlaylistClient from "./PlaylistClient";

type RouteParams = {
    playlistId: string;
};

export async function generateMetadata({
    params,
}: {
    params: Promise<RouteParams>;
}): Promise<Metadata> {
    const { playlistId } = await params;
    const playlist = await fetchPlaylistDetails(playlistId).catch(() => null);

    return {
        title: playlist?.title
            ? `${playlist.title} | Playlist Predator`
            : "Playlist | Playlist Predator",
        description: playlist?.channelTitle
            ? `Analyze and track progress for ${playlist.title} from ${playlist.channelTitle}.`
            : "Analyze and track progress across a YouTube playlist.",
    };
}

export default async function Page(props: { params: Promise<RouteParams> }) {
    const { playlistId } = await props.params;
    const userAgent = headers().get("user-agent") ?? "";
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(
        userAgent,
    );

    const playlistUrl = `https://youtube.com/playlist?list=${playlistId}`;

    let initialData: PlaylistAnalysisResponse | null = null;
    let initialError: string | null = null;

    try {
        initialData = await analyzePlaylist({ playlistUrl });
    } catch (error) {
        initialError =
            error instanceof Error ? error.message : "Failed to load playlist";
    }

    const initialProgress: PlaylistProgress =
        await loadServerProgress(playlistId);

    return (
        <PlaylistClient
            playlistId={playlistId}
            isMobile={isMobile}
            initialData={initialData}
            initialError={initialError}
            initialProgress={initialProgress}
        />
    );
}
