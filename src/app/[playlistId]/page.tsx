import type { Metadata } from "next";
import PlaylistClient from "./PlaylistClient";

export async function generateMetadata({
    params,
}: {
    params: { playlistId: string };
}): Promise<Metadata> {
    try {
        const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

        const res = await fetch(`${baseUrl}/api/playlist/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                playlistUrl: `https://youtube.com/playlist?list=${params.playlistId}`,
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

export default function Page({ params }: { params: { playlistId: string } }) {
    return <PlaylistClient playlistId={params.playlistId} />;
}
