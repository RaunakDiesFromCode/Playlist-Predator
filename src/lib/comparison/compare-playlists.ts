import { analyzePlaylist } from "@/lib/youtube/playlist";
import { parseYouTubeInput } from "@/lib/youtube/input";
import type { PlaylistMeta } from "@/types/playlist";

import {
    buildComparisonHighlights,
    buildComparisonInsights,
    buildComparisonMetrics,
    type ComparisonComparable,
    type ComparisonHighlight,
} from "./comparison-metrics";

export type ComparisonSuccessItem = ComparisonComparable & {
    status: "success";
    input: string;
    position: number;
    playlist: PlaylistMeta;
};

export type ComparisonFailureItem = {
    status: "error";
    input: string;
    position: number;
    error: string;
};

export type ComparisonItem = ComparisonSuccessItem | ComparisonFailureItem;

export type ComparisonResult = {
    items: ComparisonItem[];
    highlights: ComparisonHighlight[];
    insights: string[];
    validItems: ComparisonSuccessItem[];
};

export async function comparePlaylists(
    inputs: string[],
): Promise<ComparisonResult> {
    const normalizedInputs = inputs
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 4);

    if (normalizedInputs.length < 2) {
        throw new Error("Provide at least two playlist URLs or IDs.");
    }

    const items = await Promise.all(
        normalizedInputs.map((value, position) =>
            analyzeComparisonItem(value, position),
        ),
    );

    const validItems = items.filter(isSuccessItem);
    const comparableItems = validItems.map((item) => ({
        playlistId: item.playlistId,
        title: item.playlist.title,
        thumbnail: item.playlist.thumbnail,
        youtubeUrl: item.playlist.youtubeUrl,
        metrics: item.metrics,
    }));

    return {
        items,
        validItems,
        highlights: buildComparisonHighlights(comparableItems),
        insights: buildComparisonInsights(comparableItems),
    };
}

async function analyzeComparisonItem(
    value: string,
    position: number,
): Promise<ComparisonItem> {
    const parsed = parseYouTubeInput(value);

    if (!parsed) {
        return {
            status: "error",
            input: value,
            position,
            error: "Invalid YouTube playlist URL or ID.",
        };
    }

    if (parsed.kind !== "playlist") {
        return {
            status: "error",
            input: value,
            position,
            error: "Only playlist URLs or playlist IDs are supported.",
        };
    }

    try {
        const result = await analyzePlaylist({
            playlistUrl: `https://www.youtube.com/playlist?list=${parsed.id}`,
        });
        const totalDurationSeconds = result.videos.reduce(
            (total, video) => total + video.durationSeconds,
            0,
        );

        return {
            status: "success",
            input: value,
            position,
            playlistId: parsed.id,
            playlist: result.playlist,
            title: result.playlist.title,
            thumbnail: result.playlist.thumbnail,
            youtubeUrl: result.playlist.youtubeUrl,
            metrics: buildComparisonMetrics(
                result.summary.totalVideos,
                totalDurationSeconds,
            ),
        };
    } catch (error) {
        return {
            status: "error",
            input: value,
            position,
            error: formatComparisonError(error),
        };
    }
}

function isSuccessItem(item: ComparisonItem): item is ComparisonSuccessItem {
    return item.status === "success";
}

function formatComparisonError(error: unknown): string {
    const message =
        error instanceof Error ? error.message : "Failed to analyze playlist.";

    if (/private|unavailable|not found|disabled/i.test(message)) {
        return "Playlist is private or unavailable.";
    }

    return message;
}
