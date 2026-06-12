import type { SearchDecision, SearchResult } from "@/types/predai";

// ── Search Decision Logic ──────────────────────────────────────────────────

/**
 * Heuristic to decide if a user message requires a web search.
 *
 * Returns a SearchDecision with:
 *   - shouldSearch: whether to hit the search API
 *   - query: the search query to use (empty if shouldSearch is false)
 *   - reason: human-readable explanation (for logging)
 */
export function decideSearch(userMessage: string): SearchDecision {
    const lower = userMessage.toLowerCase().trim();

    // ── Signals that indicate web search is needed ───────────────────────

    // Current/latest version queries
    const versionPatterns = [
        /\b(latest|newest|current|recent)\b.*\b(version|release|update)\b/,
        /\bwhat(?:'s| is) the (latest|current|newest)\b/,
        /\bversion\b.*\b(of|for)\b/,
        /\b\d+\.\d+\b.*\b(release|version|out)\b/,
    ];
    for (const pattern of versionPatterns) {
        if (pattern.test(lower)) {
            return {
                shouldSearch: true,
                query: userMessage,
                reason: "Version/release query detected",
            };
        }
    }

    // "What's new" / "recent developments"
    const newsPatterns = [
        /\bwhat'?s new\b/,
        /\brecent\b.*\b(development|news|change|update|announcement)\b/,
        /\blatest\b.*\b(news|development|trend|update)\b/,
        /\bany (recent|new|latest)\b/,
    ];
    for (const pattern of newsPatterns) {
        if (pattern.test(lower)) {
            return {
                shouldSearch: true,
                query: userMessage,
                reason: "Recent developments query detected",
            };
        }
    }

    // Technology-specific current-state queries
    const techPatterns = [
        /\b(latest|current|new|popular)\b.*\b(framework|library|tool|library|package)\b/,
        /\bwhich\b.*\b(framework|library|tool|language)\b.*\b(should|best|recommend)\b/,
        /\bcompare\b.*\b(vs|versus)\b/,
        /\b(best|top|recommended)\b.*\b(resource|course|book|tutorial)\b/,
    ];
    for (const pattern of techPatterns) {
        if (pattern.test(lower)) {
            return {
                shouldSearch: true,
                query: userMessage,
                reason: "Technology comparison/recommendation query detected",
            };
        }
    }

    // Named entity queries about specific products/companies
    const entityPatterns = [
        /\b(react|vue|angular|svelte|next\.?js|nuxt|node\.?js|deno|bun)\b.*\b(version|release|update|changelog|roadmap)\b/,
        /\b(openai|anthropic|google|meta|microsoft|apple)\b.*\b(announce|release|launch|new)\b/,
        /\b(gpt|claude|gemini|llama|copilot)\b.*\b(version|release|update|new|latest)\b/,
    ];
    for (const pattern of entityPatterns) {
        if (pattern.test(lower)) {
            return {
                shouldSearch: true,
                query: userMessage,
                reason: "Named entity with version/release context detected",
            };
        }
    }

    // ── Signals that indicate web search is NOT needed ───────────────────

    // Playlist-specific questions (handled by context builder)
    if (
        /\b(video|videos)\b.*\b(\d+|#)/.test(lower) ||
        /\bwhat (?:have|has|do|did|will|should|can|would|could|is|are|was|were)\b.*\b(i|we|my)\b/.test(lower) ||
        /\b(explain|describe|summarize|summary of)\b.*\b(video|videos|this|the video)\b/.test(lower) ||
        /\b(progress|completed|remaining|skipped|done|rewatch)\b/.test(lower) ||
        /\bwhat should i (study|watch|review|revise|do|learn|practice)\b/.test(lower) ||
        /\b(next|recommend|suggest)\b.*\b(video|topic|step|lesson)\b/.test(lower) ||
        /\b(weak|strong|area|topic|skill)\b.*\b(need|should|improve|focus)\b/.test(lower)
    ) {
        return {
            shouldSearch: false,
            query: "",
            reason: "Playlist-specific question — handled by context builder",
        };
    }

    // Conceptual / definitional questions (model knowledge is sufficient)
    if (
        /\b(what is|what are|define|explain|how does|how do|why does|why is|difference between|compare)\b/.test(lower) &&
        !/\b(latest|current|newest|recent|now|today|2024|2025|2026)\b/.test(lower)
    ) {
        return {
            shouldSearch: false,
            query: "",
            reason: "Conceptual question — model knowledge is sufficient",
        };
    }

    // Default: no search
    return {
        shouldSearch: false,
        query: "",
        reason: "No web search signals detected",
    };
}

// ── Tavily Search ─────────────────────────────────────────────────────────

export interface TavilySearchResponse {
    answer?: string;
    results: Array<{
        title: string;
        url: string;
        content: string;
        score: number;
    }>;
}

/**
 * Search the web using Tavily API.
 *
 * Requires TAVILY_API_KEY in environment variables.
 * Get your key at https://tavily.com
 */
export async function searchWeb(
    query: string,
    maxResults = 5,
): Promise<SearchResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
        console.warn("[PredAI Search] TAVILY_API_KEY not configured");
        return [];
    }

    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                max_results: maxResults,
                include_answer: true,
                search_depth: "basic",
            }),
        });

        if (!response.ok) {
            console.error(
                `[PredAI Search] Tavily API error: ${response.status}`,
            );
            return [];
        }

        const data = (await response.json()) as TavilySearchResponse;

        return (data.results ?? []).map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content,
            score: r.score,
        }));
    } catch (error) {
        console.error("[PredAI Search] Search failed:", error);
        return [];
    }
}

/**
 * Format search results into a concise string for injection into the
 * system prompt.
 */
export function serializeSearchResults(
    results: SearchResult[],
    maxChars = 3000,
): string {
    if (results.length === 0) return "";

    const lines = ["## Web Search Results:\n"];
    let charCount = 0;

    for (const r of results) {
        const entry = `### ${r.title}\n${r.content}\nSource: ${r.url}\n`;
        if (charCount + entry.length > maxChars) break;
        lines.push(entry);
        charCount += entry.length;
    }

    return lines.join("\n");
}
