import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateConversation, loadMessages } from "@/lib/predai/db";

export async function GET(req: NextRequest) {
    try {
        const youtubePlaylistId = req.nextUrl.searchParams.get("playlistId");

        if (!youtubePlaylistId) {
            return NextResponse.json(
                { error: "youtubePlaylistId required" },
                { status: 400 },
            );
        }

        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const conversationId = await getOrCreateConversation(
            youtubePlaylistId,
            user.id,
        );

        const messages = await loadMessages(conversationId);

        return NextResponse.json({
            conversationId,
            messages,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error: "Failed to load history",
            },
            {
                status: 500,
            },
        );
    }
}
