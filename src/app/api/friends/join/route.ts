import { NextRequest, NextResponse } from "next/server";
import { joinByInvite } from "@/lib/db/friends";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token } = body ?? {};

        if (!token || typeof token !== "string") {
            return NextResponse.json(
                { error: "Invite token is required" },
                { status: 400 },
            );
        }

        const result = await joinByInvite(token.trim());
        return NextResponse.json(result);
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Failed to join playlist";
        const status = message === "Not authenticated" ? 401 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
