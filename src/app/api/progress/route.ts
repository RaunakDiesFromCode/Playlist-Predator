import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(req.url);
    const playlistId = searchParams.get("playlistId");

    if (!playlistId) {
        return NextResponse.json(
            { error: "playlistId required" },
            { status: 400 }
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
        .select("video_id, status")
        .eq("playlist_id", playlistId)
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const progress: Record<string, { status: string }> = {};
    for (const row of data) {
        progress[row.video_id] = { status: row.status };
    }

    return NextResponse.json(progress);
}

export async function PATCH(req: NextRequest) {
    const supabase = await createSupabaseServerClient();

    const { playlistId, videoId, status } = await req.json();

    if (!playlistId || !videoId || !status) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔁 REWATCH = DELETE
    if (status === "NONE") {
        const { error } = await supabase
            .from("playlist_progress")
            .delete()
            .eq("user_id", user.id)
            .eq("playlist_id", playlistId)
            .eq("video_id", videoId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    }

    // ✅ DONE / SKIP = UPSERT
    const { error } = await supabase.from("playlist_progress").upsert(
        {
            user_id: user.id,
            playlist_id: playlistId,
            video_id: videoId,
            status,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,playlist_id,video_id" }
    );

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

