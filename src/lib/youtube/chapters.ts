export type ChapterMarker = {
    title: string;
    startSeconds: number;
};

const CHAPTER_LINE_PATTERN = /((?:[0-5]?\d):)?([0-5]?\d):([0-5]\d)/;

export function parseTimestampToSeconds(timestamp: string): number | null {
    const parts = timestamp.split(":").map((part) => Number(part));

    if (parts.some((part) => Number.isNaN(part))) return null;

    if (parts.length === 2) {
        const [minutes, seconds] = parts;
        return minutes * 60 + seconds;
    }

    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        return hours * 3600 + minutes * 60 + seconds;
    }

    return null;
}

function cleanChapterTitle(line: string, timestamp: string) {
    return line
        .replace(timestamp, "")
        .replace(/^\s*[-–—:|]\s*/, "")
        .replace(/\s*[-–—:|]\s*$/, "")
        .trim();
}

export function extractChaptersFromDescription(description: string) {
    const markers: ChapterMarker[] = [];

    for (const rawLine of description.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;

        const match = line.match(CHAPTER_LINE_PATTERN);
        if (!match) continue;

        const timestamp = match[0];
        const startSeconds = parseTimestampToSeconds(timestamp);
        if (startSeconds === null) continue;

        const title =
            cleanChapterTitle(line, timestamp) ||
            `Chapter ${markers.length + 1}`;

        markers.push({
            title,
            startSeconds,
        });
    }

    const uniqueByStart = new Map<number, ChapterMarker>();

    for (const marker of markers) {
        if (!uniqueByStart.has(marker.startSeconds)) {
            uniqueByStart.set(marker.startSeconds, marker);
        }
    }

    return [...uniqueByStart.values()].sort(
        (a, b) => a.startSeconds - b.startSeconds,
    );
}
