import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analyzePlaylist } from "@/lib/youtube/playlist";
import { AnalyzePlaylistRequest } from "@/types/playlist";

export async function POST(req: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
