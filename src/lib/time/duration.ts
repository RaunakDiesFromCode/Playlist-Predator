export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return [h, m, s].map(pad).join(":");
}

export function calculateAdjustedDurations(seconds: number): string[] {
    const speeds = [1, 1.25, 1.5, 1.75, 2];

    return speeds.map((speed) => formatDuration(seconds / speed));
}

function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}
