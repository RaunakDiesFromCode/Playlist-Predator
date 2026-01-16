import type { Metadata } from "next";
import PlaylistClient from "./PlaylistClient";

type RouteParams = {
    playlistId: string;
};

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Playlist | Playlist Predator",
    };
}

export default async function Page(props: { params: Promise<RouteParams> }) {
    const { playlistId } = await props.params;

    return <PlaylistClient playlistId={playlistId} />;
}
