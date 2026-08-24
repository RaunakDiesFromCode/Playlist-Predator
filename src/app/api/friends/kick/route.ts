import { NextRequest, NextResponse } from "next/server";
import { kickMember } from "@/lib/db/friends";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { playlistId, targetUserId } = body ?? {};

        if (!playlistId || !targetUserId) {
            return NextResponse.json(
                { error: "playlistId and targetUserId are required" },
                { status: 400 },
            );
        }

        await kickMember(playlistId, targetUserId);
        return NextResponse.json({ success: true });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Failed to remove member";
        const status = message === "Not authenticated" ? 401 : 403;
        return NextResponse.json({ error: message }, { status });
    }
}
