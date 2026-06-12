import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT } from "@/lib/predai/prompts";
import { buildPredAIContext, serializeContext } from "@/lib/predai/context-builder";
import { decideSearch, searchWeb, serializeSearchResults } from "@/lib/predai/search";
import { getOrCreateConversation } from "@/lib/predai/db";
import type { ChatMessage } from "@/types/predai";
import type { PlaylistAnalysisResponse } from "@/types/playlist";
import type { PlaylistProgress } from "@/types/progress";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.PREDAI_MODEL ?? "openai/gpt-oss-120b:free";

export async function POST(req: NextRequest) {
    // ── Auth ──────────────────────────────────────────────────────────────
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse request ─────────────────────────────────────────────────────
    const body = await req.json();
    const messages: ChatMessage[] = body.messages ?? [];
    const playlistId: string = body.playlistId;
    const initialData: PlaylistAnalysisResponse | null | undefined =
        body.initialData;
    const initialProgress: PlaylistProgress | undefined = body.initialProgress;

    if (!playlistId) {
        return NextResponse.json(
            { error: "playlistId is required" },
            { status: 400 },
        );
    }

    // ── Get or create conversation ────────────────────────────────────────
    const conversationId = await getOrCreateConversation(
        playlistId,
        user.id,
    );

    // ── Build context (server-side) ───────────────────────────────────────
    let contextStr: string;
    try {
        const ctx = await buildPredAIContext(playlistId, {
            initialData,
            initialProgress,
        });
        contextStr = serializeContext(ctx);
    } catch (contextError) {
        console.error("[PredAI] Context build failed:", contextError);
        contextStr =
            "Playlist context unavailable. Answer based on the conversation.";
    }

    // ── Decide if web search is needed ────────────────────────────────────
    const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");
    const searchDecision = lastUserMessage
        ? decideSearch(lastUserMessage.content)
        : {
              shouldSearch: false,
              query: "",
              reason: "No user message found",
          };

    let searchResultsStr = "";
    if (searchDecision.shouldSearch) {
        console.log(
            `[PredAI] Search triggered: "${searchDecision.query}" — ${searchDecision.reason}`,
        );
        const results = await searchWeb(searchDecision.query);
        searchResultsStr = serializeSearchResults(results);
    }

    // ── Build system prompt ───────────────────────────────────────────────
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

    // ── Call OpenRouter with streaming ─────────────────────────────────────
    const openRouterMessages: ChatMessage[] = [
        { id: "system", role: "system", content: systemPrompt, createdAt: 0 },
        ...messages,
    ];

    if (!OPENROUTER_API_KEY) {
        return NextResponse.json(
            { error: "OpenRouter API key not configured" },
            { status: 500 },
        );
    }

    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer":
                    process.env.NEXT_PUBLIC_SITE_URL ??
                    "http://localhost:3000",
                "X-Title": "PredAI - Playlist Study Assistant",
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                stream: true,
                messages: openRouterMessages,
            }),
        },
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error(
            "[PredAI] OpenRouter error:",
            response.status,
            errorText,
        );
        return NextResponse.json(
            { error: "AI service error" },
            { status: 502 },
        );
    }

    // ── Stream response back to client ────────────────────────────────────
    return new Response(response.body, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Conversation-Id": conversationId,
        },
    });
}
