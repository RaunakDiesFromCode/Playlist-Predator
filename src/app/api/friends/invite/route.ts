import { NextRequest, NextResponse } from "next/server";
import { regenerateInvite } from "@/lib/db/friends";

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

        const newInviteToken = await regenerateInvite(playlistId);
        return NextResponse.json({ inviteToken: newInviteToken });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Failed to regenerate invite";
        const status = message === "Not authenticated" ? 401 : 403;
        return NextResponse.json({ error: message }, { status });
    }
}
