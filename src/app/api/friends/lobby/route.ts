import { NextRequest, NextResponse } from "next/server";
import { getLobbyInfo } from "@/lib/db/friends";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const playlistId = searchParams.get("playlistId");
        const totalVideos = Number(searchParams.get("totalVideos") ?? "0");

        if (!playlistId) {
            return NextResponse.json(
                { error: "playlistId is required" },
                { status: 400 },
            );
        }

        const lobby = await getLobbyInfo(playlistId, totalVideos);
        return NextResponse.json({ lobby });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Failed to load lobby";
        const status = message === "Not authenticated" ? 401 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
