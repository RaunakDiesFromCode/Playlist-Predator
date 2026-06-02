import { formatDuration } from "@/lib/time/duration";

export const COMPARISON_SPEEDS = [1.25, 1.5, 2] as const;

export type ComparisonSpeed = (typeof COMPARISON_SPEEDS)[number];

export type ComparisonMetrics = {
    totalVideos: number;
    totalDurationSeconds: number;
    totalDuration: string;
    durationsBySpeed: Record<ComparisonSpeed, string>;
};

export type ComparisonComparable = {
    playlistId: string;
    title: string;
    thumbnail?: string | null;
    youtubeUrl: string;
    metrics: ComparisonMetrics;
};

export type ComparisonHighlightKind =
    | "shortest"
    | "longest"
    | "most-videos"
    | "fewest-videos";

export type ComparisonHighlight = ComparisonComparable & {
    kind: ComparisonHighlightKind;
    label: string;
    description: string;
};

export function buildComparisonMetrics(
    totalVideos: number,
    totalDurationSeconds: number,
): ComparisonMetrics {
    return {
        totalVideos,
        totalDurationSeconds,
        totalDuration: formatDuration(totalDurationSeconds),
        durationsBySpeed: {
            1.25: formatDuration(totalDurationSeconds / 1.25),
            1.5: formatDuration(totalDurationSeconds / 1.5),
            2: formatDuration(totalDurationSeconds / 2),
        },
    };
}

export function buildComparisonHighlights(
    items: ComparisonComparable[],
): ComparisonHighlight[] {
    if (items.length === 0) {
        return [];
    }

    const shortest = pickSmallest(
        items,
        (item) => item.metrics.totalDurationSeconds,
    );
    const longest = pickLargest(
        items,
        (item) => item.metrics.totalDurationSeconds,
    );
    const mostVideos = pickLargest(items, (item) => item.metrics.totalVideos);
    const fewestVideos = pickSmallest(
        items,
        (item) => item.metrics.totalVideos,
    );

    return [
        buildHighlight(
            shortest,
            "shortest",
            "Shortest",
            "Least total watch time",
        ),
        buildHighlight(longest, "longest", "Longest", "Most total watch time"),
        buildHighlight(
            mostVideos,
            "most-videos",
            "Most videos",
            "Largest video count",
        ),
        buildHighlight(
            fewestVideos,
            "fewest-videos",
            "Fewest videos",
            "Smallest video count",
        ),
    ];
}

export function buildComparisonInsights(
    items: ComparisonComparable[],
): string[] {
    if (items.length < 2) {
        return [];
    }

    const shortest = pickSmallest(
        items,
        (item) => item.metrics.totalDurationSeconds,
    );
    const longest = pickLargest(
        items,
        (item) => item.metrics.totalDurationSeconds,
    );
    const mostVideos = pickLargest(items, (item) => item.metrics.totalVideos);
    const fewestVideos = pickSmallest(
        items,
        (item) => item.metrics.totalVideos,
    );

    const insights: string[] = [];

    if (
        longest.metrics.totalDurationSeconds >
        shortest.metrics.totalDurationSeconds
    ) {
        insights.push(
            `${shortest.title} is ${formatPercentageDifference(shortest.metrics.totalDurationSeconds, longest.metrics.totalDurationSeconds)} shorter than ${longest.title}.`,
        );
    }

    if (mostVideos.metrics.totalVideos > fewestVideos.metrics.totalVideos) {
        insights.push(
            `${fewestVideos.title} has ${mostVideos.metrics.totalVideos - fewestVideos.metrics.totalVideos} fewer videos than ${mostVideos.title}.`,
        );
    }

    const savedAtTwoX = longest.metrics.totalDurationSeconds / 2;
    if (savedAtTwoX > 0) {
        insights.push(
            `Watching ${longest.title} at 2x saves ${formatStudyTime(savedAtTwoX)} compared with 1x playback.`,
        );
    }

    return insights;
}

function buildHighlight(
    item: ComparisonComparable,
    kind: ComparisonHighlightKind,
    label: string,
    description: string,
): ComparisonHighlight {
    return {
        ...item,
        kind,
        label,
        description,
    };
}

function pickSmallest<T>(items: T[], selector: (item: T) => number): T {
    return items.reduce((best, current) =>
        selector(current) < selector(best) ? current : best,
    );
}

function pickLargest<T>(items: T[], selector: (item: T) => number): T {
    return items.reduce((best, current) =>
        selector(current) > selector(best) ? current : best,
    );
}

function formatPercentageDifference(smaller: number, larger: number): string {
    if (larger <= 0 || larger === smaller) {
        return "0%";
    }

    return `${Math.round(((larger - smaller) / larger) * 100)}%`;
}

function formatStudyTime(seconds: number): string {
    const totalMinutes = Math.max(Math.round(seconds / 60), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes}m`;
    }

    if (minutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
}
