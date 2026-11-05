import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_STATUSES = new Set(["NONE", "DONE", "REWATCH", "SKIP"]);

function getCorsHeaders(req: Request) {
    const origin = req.headers.get("origin") || "*";
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
    };
}

export async function OPTIONS(req: Request) {
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
    const corsHeaders = getCorsHeaders(req);
    try {
        const supabase = await createSupabaseServerClient();

        const { searchParams } = new URL(req.url);
        const playlistId = searchParams.get("playlistId");

        if (!playlistId) {
            return NextResponse.json(
                { error: "playlistId required" },
                { status: 400, headers: corsHeaders },
            );
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: corsHeaders },
            );
        }

        const { data, error } = await supabase
            .from("playlist_progress")
            .select("video_id, status, updated_at")
            .eq("playlist_id", playlistId)
            .eq("user_id", user.id);

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500, headers: corsHeaders },
            );
        }

        const progress: Record<string, { status: string; updatedAt?: string }> = {};
        for (const row of data) {
            progress[row.video_id] = {
                status: row.status,
                updatedAt: row.updated_at,
            };
        }

        return NextResponse.json(progress, { headers: corsHeaders });
    } catch {
        return NextResponse.json(
            { error: "Failed to load progress" },
            { status: 500, headers: corsHeaders },
        );
    }
}

export async function PATCH(req: NextRequest) {
    const corsHeaders = getCorsHeaders(req);
    try {
        const supabase = await createSupabaseServerClient();

        const { playlistId, videoId, status, onlyIfStudy } = await req.json();

        if (!playlistId || !videoId || !status) {
            return NextResponse.json(
                { error: "Invalid payload" },
                { status: 400, headers: corsHeaders },
            );
        }

        if (!VALID_STATUSES.has(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400, headers: corsHeaders },
            );
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: corsHeaders },
            );
        }

        // If requested by extension, protect non-study states:
        // Do not update if already DONE, REWATCH, or SKIP
        if (onlyIfStudy) {
            const { data: existing } = await supabase
                .from("playlist_progress")
                .select("status")
                .eq("playlist_id", playlistId)
                .eq("video_id", videoId)
                .eq("user_id", user.id)
                .maybeSingle();

            if (existing?.status && existing.status !== "NONE") {
                return NextResponse.json(
                    {
                        success: true,
                        unchanged: true,
                        currentStatus: existing.status,
                        message: `Video is already marked as ${existing.status}; state preserved.`,
                    },
                    { headers: corsHeaders },
                );
            }
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
            return NextResponse.json(
                { error: error.message },
                { status: 500, headers: corsHeaders },
            );
        }

        return NextResponse.json({ success: true }, { headers: corsHeaders });
    } catch {
        return NextResponse.json(
            { error: "Failed to update progress" },
            { status: 500, headers: corsHeaders },
        );
    }
}
