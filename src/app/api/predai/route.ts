import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT } from "@/lib/predai/prompts";
import {
    buildPredAIContext,
    serializeContext,
} from "@/lib/predai/context-builder";
import {
    decideSearch,
    searchWeb,
    serializeSearchResults,
} from "@/lib/predai/search";
import { getOrCreateConversation } from "@/lib/predai/db";
import type { ChatMessage } from "@/types/predai";
import type { PlaylistAnalysisResponse } from "@/types/playlist";
import type { PlaylistProgress } from "@/types/progress";

const NVIDIA_API_KEY = process.env.NVIDIA_NIM_API_KEY;
const NIM_MODEL = process.env.NIM_MODEL ?? "nvidia/nvidia-nemotron-nano-9b-v2";

export async function POST(req: NextRequest) {
    // ─────────────────────────────────────────────────────────────────────
    // Authentication
    // s─────────────────────────────────────────────────────────────────────

    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Parse Request
    // ─────────────────────────────────────────────────────────────────────

    const body = await req.json();

    const messages: ChatMessage[] = body.messages ?? [];
    const playlistId: string = body.playlistId;

    const initialData: PlaylistAnalysisResponse | null | undefined =
        body.initialData;

    const initialProgress: PlaylistProgress | undefined = body.initialProgress;

    if (!playlistId) {
        return NextResponse.json(
            {
                error: "playlistId is required",
            },
            {
                status: 400,
            },
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Conversation
    // ─────────────────────────────────────────────────────────────────────

    const conversationId = await getOrCreateConversation(playlistId, user.id);

    // ─────────────────────────────────────────────────────────────────────
    // Playlist Context
    // ─────────────────────────────────────────────────────────────────────

    let contextStr: string;

    try {
        const ctx = await buildPredAIContext(playlistId, {
            initialData,
            initialProgress,
        });

        contextStr = serializeContext(ctx);
    } catch (err) {
        console.error("[PredAI] Context build failed:", err);

        contextStr =
            "Playlist context unavailable. Answer using only the conversation.";
    }

    // ─────────────────────────────────────────────────────────────────────
    // Optional Search
    // ─────────────────────────────────────────────────────────────────────

    const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");

    const searchDecision = lastUserMessage
        ? decideSearch(lastUserMessage.content)
        : {
              shouldSearch: false,
              query: "",
              reason: "No user message",
          };

    let searchResultsStr = "";

    if (searchDecision.shouldSearch) {
        console.log(
            `[PredAI] Search: "${searchDecision.query}" (${searchDecision.reason})`,
        );

        const results = await searchWeb(searchDecision.query);

        searchResultsStr = serializeSearchResults(results);
    }

    // ─────────────────────────────────────────────────────────────────────
    // System Prompt
    // ─────────────────────────────────────────────────────────────────────

    const systemPrompt = [
        SYSTEM_PROMPT,
        "",
        "## Current Playlist Context",
        contextStr,
        "",
        searchResultsStr,
    ]
        .filter(Boolean)
        .join("\n");

    // NVIDIA accepts ONLY role + content.
    const nimMessages = [
        {
            role: "system",
            content: systemPrompt,
        },
        ...messages.map(({ role, content }) => ({
            role,
            content,
        })),
    ];

    if (!NVIDIA_API_KEY) {
        return NextResponse.json(
            {
                error: "NVIDIA_NIM_API_KEY is not configured.",
            },
            {
                status: 500,
            },
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Call NVIDIA NIM
    // ─────────────────────────────────────────────────────────────────────

    try {
        const response = await fetch(
            "https://integrate.api.nvidia.com/v1/chat/completions",
            {
                method: "POST",
                signal: req.signal,
                headers: {
                    Authorization: `Bearer ${NVIDIA_API_KEY}`,
                    "Content-Type": "application/json",
                    Accept: "text/event-stream",
                },
                body: JSON.stringify({
                    model: NIM_MODEL,
                    messages: nimMessages,
                    stream: true,

                    temperature: 1,
                    top_p: 0.95,
                    max_tokens: 8192,

                    reasoning_effort: "none",
                }),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();

            console.error(
                "[PredAI] NVIDIA NIM Error:",
                response.status,
                errorText,
            );

            return NextResponse.json(
                {
                    error: errorText,
                },
                {
                    status: response.status,
                },
            );
        }

        // Pass the SSE stream straight through.
        return new Response(response.body, {
            status: response.status,
            headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
                "X-Conversation-Id": conversationId,
            },
        });
    } catch (err) {
        console.error("[PredAI] Fetch failed:", err);

        return NextResponse.json(
            {
                error: "Failed to contact NVIDIA NIM.",
            },
            {
                status: 500,
            },
        );
    }
}
