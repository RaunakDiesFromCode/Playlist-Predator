import { NextRequest, NextResponse } from "next/server";
import { analyzePlaylist } from "@/lib/youtube/playlist";
import { AnalyzePlaylistRequest } from "@/types/playlist";

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as AnalyzePlaylistRequest;

        if (!body.playlistUrl) {
            return NextResponse.json(
                { error: "Playlist URL is required" },
                { status: 400 }
            );
        }

        const result = await analyzePlaylist(body);
        return NextResponse.json(result, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to analyze playlist",
            },
            { status: 500 }
        );
    }
}
