import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_STATUSES = new Set(["NONE", "DONE", "REWATCH", "SKIP"]);

export async function GET(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const { searchParams } = new URL(req.url);
        const playlistId = searchParams.get("playlistId");

        if (!playlistId) {
            return NextResponse.json(
                { error: "playlistId required" },
                { status: 400 },
            );
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("playlist_progress")
            .select("video_id, status, updated_at")
            .eq("playlist_id", playlistId)
            .eq("user_id", user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const progress: Record<string, { status: string; updatedAt?: string }> = {};
        for (const row of data) {
            progress[row.video_id] = {
                status: row.status,
                updatedAt: row.updated_at,
            };
        }

        return NextResponse.json(progress);
    } catch {
        return NextResponse.json(
            { error: "Failed to load progress" },
            { status: 500 },
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const { playlistId, videoId, status } = await req.json();

        if (!playlistId || !videoId || !status) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        if (!VALID_STATUSES.has(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await supabase.from("playlist_progress").upsert(
            {
                user_id: user.id,
                playlist_id: playlistId,
                video_id: videoId,
                status,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,playlist_id,video_id" },
        );

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Failed to update progress" },
            { status: 500 },
        );
    }
}
