import { NextResponse } from "next/server";
import { getUserPlaylists, createPlaylist } from "@/lib/db/playlists";

export async function GET() {
    try {
        const playlists = await getUserPlaylists();
        return NextResponse.json(playlists);
    } catch (err) {
        return NextResponse.json(
            {
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch playlists",
            },
            { status: 401 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { youtube_playlist_id, title, thumbnail } = body ?? {};

        if (!youtube_playlist_id) {
            return NextResponse.json(
                { error: "youtube_playlist_id is required" },
                { status: 400 }
            );
        }

        const playlist = await createPlaylist({
            youtube_playlist_id,
            title,
            thumbnail,
        });

        return NextResponse.json(playlist, { status: 201 });
    } catch (err) {
        return NextResponse.json(
            {
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to create playlist",
            },
            { status: 401 }
        );
    }
}
