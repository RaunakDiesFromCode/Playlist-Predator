import type { Metadata } from "next";
import PlaylistClient from "./PlaylistClient";

type RouteParams = {
    playlistId: string;
};

export async function generateMetadata(props: {
    params: Promise<RouteParams>;
}): Promise<Metadata> {
    const { playlistId } = await props.params;

    try {
        const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

        const res = await fetch(`${baseUrl}/api/playlist/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                playlistUrl: `https://youtube.com/playlist?list=${playlistId}`,
            }),
            cache: "no-store",
        });

        const data = await res.json();

        return {
            title: data.playlist?.title ?? "Playlist",
        };
    } catch {
        return { title: "Playlist" };
    }
}

export default async function Page(props: { params: Promise<RouteParams> }) {
    const { playlistId } = await props.params;

    return <PlaylistClient playlistId={playlistId} />;
}
