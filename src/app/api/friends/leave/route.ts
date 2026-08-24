import { NextRequest, NextResponse } from "next/server";
import { leavePlaylist } from "@/lib/db/friends";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { playlistId } = body ?? {};

        if (!playlistId || typeof playlistId !== "string") {
            return NextResponse.json(
                { error: "playlistId is required" },
                { status: 400 },
            );
        }

        await leavePlaylist(playlistId);
        return NextResponse.json({ success: true });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Failed to leave playlist";
        const status = message === "Not authenticated" ? 401 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
