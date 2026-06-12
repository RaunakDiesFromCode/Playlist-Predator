import { analyzePlaylist } from "@/lib/youtube/playlist";
import { loadServerProgress } from "@/lib/progress/server";
import {
    calculateDaysRequired,
    calculateCompletionDate,
    calculateSpeedAdjustedMinutes,
} from "@/lib/planner/planner";
import type {
    PredAIContext,
    PlaylistContext,
    VideoContext,
    VideoContextItem,
    AnalysisContext,
    StudyPlannerContext,
} from "@/types/predai";
import type { PlaylistAnalysisResponse } from "@/types/playlist";
import type { PlaylistProgress, VideoStatus } from "@/types/progress";

export interface BuildContextOptions {
    /** Pre-fetched playlist analysis from the browser (avoids server-side YouTube API call) */
    initialData?: PlaylistAnalysisResponse | null;
    /** Pre-fetched progress from the browser */
    initialProgress?: PlaylistProgress;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Replace non-ASCII characters that break Node's fetch ByteString encoding.
 * YouTube titles commonly contain em dashes (—), smart quotes, etc.
 */
function sanitizeString(input: string): string {
    return input
        .replace(/—/g, "-")   // em dash → hyphen
        .replace(/–/g, "-")   // en dash → hyphen
        .replace(/‘/g, "'")   // left single quote
        .replace(/’/g, "'")   // right single quote
        .replace(/“/g, '"')   // left double quote
        .replace(/”/g, '"')   // right double quote
        .replace(/…/g, "...") // ellipsis
        .replace(/[^\x00-\x7F]/g, ""); // strip anything remaining
}

function getStatusLabel(status: VideoStatus): VideoContextItem["status"] {
    if (status === "DONE" || status === "REWATCH") return "completed";
    if (status === "SKIP") return "skipped";
    return "remaining";
}

/**
 * Infer topics from video titles using keyword extraction.
 * In production, replace with NLP or LLM-based topic extraction.
 */
function inferTopics(videoTitles: string[]): string[] {
    const stopWords = new Set([
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
        "for", "of", "with", "by", "from", "is", "are", "was", "were",
        "be", "been", "being", "have", "has", "had", "do", "does", "did",
        "will", "would", "could", "should", "may", "might", "can", "shall",
        "this", "that", "these", "those", "it", "its", "not", "no", "yes",
        "if", "then", "else", "when", "where", "how", "what", "which", "who",
        "whom", "why", "all", "each", "every", "both", "few", "more", "most",
        "other", "some", "such", "only", "own", "same", "so", "than", "too",
        "very", "just", "about", "above", "after", "again", "also", "as",
        "because", "before", "between", "during", "into", "over", "under",
        "up", "out", "off", "new", "old", "first", "last", "long", "great",
        "little", "right", "big", "high", "small", "large", "next", "early",
        "young", "important", "public", "bad", "good", "best", "better",
        "full", "free", "true", "false", "real", "full", "able", "like",
        "one", "two", "three", "four", "five", "six", "seven", "eight",
        "nine", "ten", "intro", "introduction", "overview", "summary",
        "conclusion", "getting", "started", "beginner", "advanced", "tutorial",
        "guide", "course", "lesson", "lecture", "part", "chapter", "episode",
        "step", "tips", "tricks", "basics", "fundamentals", "crash", "complete",
        "full", "series", "playlist", "video", "vs", "versus", "using", "learn",
    ]);

    const freq: Record<string, number> = {};

    for (const title of videoTitles) {
        const words = title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .split(/\s+/)
            .filter((w) => w.length > 2 && !stopWords.has(w));

        for (const word of words) {
            freq[word] = (freq[word] ?? 0) + 1;
        }
    }

    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([word]) => word);
}

/**
 * Infer difficulty from video count, total duration, and title keywords.
 */
function inferDifficulty(
    videoTitles: string[],
    totalVideos: number,
    totalDurationSeconds: number,
): AnalysisContext["difficulty"] {
    const advancedKeywords = [
        "advanced", "expert", "deep", "dive", "internals", "architecture",
        "optimization", "performance", "scalable", "distributed", "microservice",
        "kubernetes", "docker", "ci/cd", "security", "cryptography",
    ];
    const beginnerKeywords = [
        "beginner", "intro", "introduction", "basics", "fundamentals",
        "getting started", "101", "crash course", "for beginners", "simple",
        "easy", "learn", "start",
    ];

    const titleStr = videoTitles.join(" ").toLowerCase();
    const advancedCount = advancedKeywords.filter((k) => titleStr.includes(k)).length;
    const beginnerCount = beginnerKeywords.filter((k) => titleStr.includes(k)).length;

    if (advancedCount > 3 || (totalVideos > 20 && totalDurationSeconds > 36000)) {
        return "advanced";
    }
    if (beginnerCount > 3 || totalVideos <= 5) {
        return "beginner";
    }
    if (Math.abs(advancedCount - beginnerCount) <= 1 && totalVideos > 10) {
        return "mixed";
    }
    return "intermediate";
}

/**
 * Infer skills from topic keywords.
 */
function inferSkills(topics: string[]): string[] {
    const skillMap: Record<string, string> = {
        react: "React",
        javascript: "JavaScript",
        typescript: "TypeScript",
        python: "Python",
        node: "Node.js",
        nodejs: "Node.js",
        express: "Express.js",
        next: "Next.js",
        nextjs: "Next.js",
        vue: "Vue.js",
        angular: "Angular",
        svelte: "Svelte",
        html: "HTML",
        css: "CSS",
        tailwind: "Tailwind CSS",
        sql: "SQL",
        postgres: "PostgreSQL",
        mongodb: "MongoDB",
        redis: "Redis",
        graphql: "GraphQL",
        rest: "REST APIs",
        api: "API Design",
        docker: "Docker",
        kubernetes: "Kubernetes",
        aws: "AWS",
        gcp: "GCP",
        azure: "Azure",
        git: "Git",
        testing: "Testing",
        jest: "Jest",
        cypress: "Cypress",
        machine: "Machine Learning",
        ai: "Artificial Intelligence",
        deep: "Deep Learning",
        neural: "Neural Networks",
        nlp: "Natural Language Processing",
        computer: "Computer Vision",
        data: "Data Science",
        algorithm: "Algorithms",
        design: "System Design",
        architecture: "Software Architecture",
        security: "Security",
        performance: "Performance Optimization",
        accessibility: "Accessibility",
        agile: "Agile",
        devops: "DevOps",
        cicd: "CI/CD",
    };

    const skills = new Set<string>();
    for (const topic of topics) {
        for (const [key, skill] of Object.entries(skillMap)) {
            if (topic.includes(key)) {
                skills.add(skill);
            }
        }
    }

    return Array.from(skills).slice(0, 10);
}

/**
 * Infer prerequisites from topics and difficulty.
 */
function inferPrerequisites(
    topics: string[],
    difficulty: AnalysisContext["difficulty"],
): string[] {
    const prereqs: string[] = [];

    const hasReact = topics.some((t) => ["react", "next", "nextjs"].includes(t));
    const hasNode = topics.some((t) => ["node", "nodejs", "express"].includes(t));
    const hasTS = topics.some((t) => t.includes("typescript"));
    const hasML = topics.some((t) =>
        ["machine", "deep", "neural", "ai", "nlp"].includes(t),
    );

    if (hasReact) {
        prereqs.push("HTML & CSS fundamentals");
        prereqs.push("JavaScript basics");
    }
    if (hasTS) {
        prereqs.push("JavaScript fundamentals");
    }
    if (hasNode) {
        prereqs.push("JavaScript basics");
    }
    if (hasML) {
        prereqs.push("Python programming");
        prereqs.push("Basic statistics and linear algebra");
    }
    if (difficulty === "advanced") {
        prereqs.push("Familiarity with the basics of this subject");
    }

    return [...new Set(prereqs)].slice(0, 5);
}

// ── Main Builder ───────────────────────────────────────────────────────────

export async function buildPredAIContext(
    playlistId: string,
    options?: BuildContextOptions,
): Promise<PredAIContext> {
    // 1. Get playlist analysis — prefer pre-fetched data from browser,
    //    fall back to server-side YouTube API call
    let analysis: PlaylistAnalysisResponse;
    if (options?.initialData) {
        analysis = options.initialData;
    } else {
        analysis = await analyzePlaylist({
            playlistUrl: `https://youtube.com/playlist?list=${playlistId}`,
        });
    }

    // 2. Get user progress — prefer pre-fetched, fall back to DB query
    const progress: PlaylistProgress =
        options?.initialProgress ?? (await loadServerProgress(playlistId));

    // 3. Build playlist context
    const completedVideos = analysis.videos.filter(
        (v) =>
            progress[v.videoId]?.status === "DONE" ||
            progress[v.videoId]?.status === "REWATCH",
    ).length;
    const skippedVideos = analysis.videos.filter(
        (v) => progress[v.videoId]?.status === "SKIP",
    ).length;
    const remainingVideos = analysis.videos.length - completedVideos - skippedVideos;

    const playlistContext: PlaylistContext = {
        title: sanitizeString(analysis.playlist.title),
        channelTitle: sanitizeString(analysis.playlist.channelTitle),
        totalVideos: analysis.videos.length,
        completedVideos,
        skippedVideos,
        remainingVideos,
        totalDuration: analysis.summary.totalDuration,
        remainingDuration: analysis.summary.remainingDuration,
    };

    // 4. Build video context — sanitize titles that may contain non-ASCII
    //    characters (em dashes, smart quotes, etc.) from YouTube metadata
    const videoItems: VideoContextItem[] = analysis.videos.map((v) => ({
        position: v.position,
        title: sanitizeString(v.title),
        duration: v.durationFormatted,
        status: getStatusLabel(progress[v.videoId]?.status ?? "NONE"),
    }));

    const videoContext: VideoContext = { items: videoItems };

    // 5. Build analysis context
    const topics = inferTopics(analysis.videos.map((v) => v.title));
    const difficulty = inferDifficulty(
        analysis.videos.map((v) => v.title),
        analysis.videos.length,
        analysis.videos.reduce((sum, v) => sum + v.durationSeconds, 0),
    );
    const skillsCovered = inferSkills(topics);
    const prerequisites = inferPrerequisites(topics, difficulty);

    const analysisContext: AnalysisContext = {
        topics,
        difficulty,
        skillsCovered,
        prerequisites,
        summary: `${sanitizeString(analysis.playlist.title)} by ${sanitizeString(analysis.playlist.channelTitle)} - ${analysis.videos.length} videos, ${analysis.summary.totalDuration} total.`,
    };

    // 6. Build study planner context
    const totalRemainingSeconds = analysis.videos
        .filter((v) => {
            const s = progress[v.videoId]?.status;
            return s !== "DONE" && s !== "REWATCH" && s !== "SKIP";
        })
        .reduce((sum, v) => sum + v.durationSeconds, 0);

    const remainingMinutes = totalRemainingSeconds / 60;
    const preferredSpeed = 1.5; // default; can be overridden by user preferences
    const adjustedMinutes = calculateSpeedAdjustedMinutes(
        remainingMinutes,
        preferredSpeed,
    );
    const dailyStudyMinutes = 60; // default 1 hour/day
    const estimatedDays = calculateDaysRequired(adjustedMinutes, dailyStudyMinutes);
    const completionDate = calculateCompletionDate(adjustedMinutes, dailyStudyMinutes);

    const plannerContext: StudyPlannerContext = {
        preferredSpeed,
        dailyStudyMinutes,
        estimatedDaysToComplete: estimatedDays,
        estimatedCompletionDate: completionDate
            ? completionDate.toISOString().split("T")[0]
            : null,
    };

    return {
        playlist: playlistContext,
        videos: videoContext,
        analysis: analysisContext,
        planner: plannerContext,
    };
}

/**
 * Serialize context into a system-prompt-friendly string.
 * Keeps it concise to minimize token usage.
 */
export function serializeContext(ctx: PredAIContext): string {
    const lines: string[] = [];

    lines.push(`## Playlist: ${ctx.playlist.title}`);
    lines.push(`Channel: ${ctx.playlist.channelTitle}`);
    lines.push(
        `Progress: ${ctx.playlist.completedVideos}/${ctx.playlist.totalVideos} completed, ${ctx.playlist.skippedVideos} skipped, ${ctx.playlist.remainingVideos} remaining`,
    );
    lines.push(
        `Duration: ${ctx.playlist.totalDuration} total, ${ctx.playlist.remainingDuration} remaining`,
    );

    lines.push(`\n## Topics Covered: ${ctx.analysis.topics.join(", ")}`);
    lines.push(`Difficulty: ${ctx.analysis.difficulty}`);
    if (ctx.analysis.skillsCovered.length > 0) {
        lines.push(`Skills: ${ctx.analysis.skillsCovered.join(", ")}`);
    }
    if (ctx.analysis.prerequisites.length > 0) {
        lines.push(`Prerequisites: ${ctx.analysis.prerequisites.join(", ")}`);
    }

    lines.push(
        `\n## Study Plan: ${ctx.planner.estimatedDaysToComplete} days remaining at ${ctx.planner.preferredSpeed}× speed, ~${ctx.planner.dailyStudyMinutes} min/day`,
    );
    if (ctx.planner.estimatedCompletionDate) {
        lines.push(`Estimated completion: ${ctx.planner.estimatedCompletionDate}`);
    }

    // Video list with status (limit to first 50 to stay within token budget)
    lines.push("\n## Videos:");
    const videoLines = ctx.videos.items.slice(0, 50).map((v) => {
        const statusEmoji =
            v.status === "completed"
                ? "✅"
                : v.status === "skipped"
                  ? "⏭️"
                  : "⬜";
        return `${statusEmoji} ${v.position}. ${v.title} (${v.duration})`;
    });
    lines.push(...videoLines);

    if (ctx.videos.items.length > 50) {
        lines.push(
            `... and ${ctx.videos.items.length - 50} more videos not shown for brevity.`,
        );
    }

    return lines.join("\n");
}
