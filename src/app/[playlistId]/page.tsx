import type { Metadata } from "next";
import { headers } from "next/headers";
import { analyzePlaylist } from "@/lib/youtube/playlist";
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
    const playlist = await analyzeFromIdentifier(playlistId)
        .then((result) => result?.playlist ?? null)
        .catch(() => null);

    return {
        title: playlist?.title
            ? `${playlist.title} | Playlist Predator`
            : "Playlist Predator",
        description: playlist?.channelTitle
            ? `Analyze and track progress for ${playlist.title} from ${playlist.channelTitle}.`
            : "Analyze and track progress across a YouTube playlist or video chapters.",
    };
}

export default async function Page(props: { params: Promise<RouteParams> }) {
    const { playlistId } = await props.params;
    const userAgent = (await headers()).get("user-agent") ?? "";
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(
        userAgent,
    );

    let initialData: PlaylistAnalysisResponse | null = null;
    let initialError: string | null = null;

    try {
        initialData = await analyzeFromIdentifier(playlistId);
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

async function analyzeFromIdentifier(playlistId: string) {
    const playlistUrl = `https://youtube.com/playlist?list=${playlistId}`;
    const videoUrl = `https://youtube.com/watch?v=${playlistId}`;

    try {
        return await analyzePlaylist({ playlistUrl });
    } catch {
        return analyzePlaylist({ playlistUrl: videoUrl });
    }
}
