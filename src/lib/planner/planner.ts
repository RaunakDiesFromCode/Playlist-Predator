export type FastestSaneSpeed = {
    label: string;
    value: number;
};

export const FASTEST_SANE_SPEEDS: FastestSaneSpeed[] = [
    { label: "1×", value: 1 },
    { label: "1.25×", value: 1.25 },
    { label: "1.5×", value: 1.5 },
    { label: "2×", value: 2 },
    { label: "3×", value: 3 },
    { label: "4×", value: 4 },
];

export function calculateDaysRequired(
    remainingMinutes: number,
    dailyMinutes: number,
): number {
    if (!Number.isFinite(remainingMinutes) || !Number.isFinite(dailyMinutes)) {
        return 0;
    }

    if (remainingMinutes <= 0 || dailyMinutes <= 0) {
        return 0;
    }

    return Math.ceil(remainingMinutes / dailyMinutes);
}

export function calculateSpeedAdjustedMinutes(
    remainingMinutes: number,
    speed: number,
): number {
    if (!Number.isFinite(remainingMinutes) || !Number.isFinite(speed)) {
        return 0;
    }

    if (remainingMinutes <= 0 || speed <= 0) {
        return 0;
    }

    return remainingMinutes / speed;
}

export function calculateCompletionDate(
    remainingMinutes: number,
    dailyMinutes: number,
): Date | null {
    if (!Number.isFinite(remainingMinutes) || !Number.isFinite(dailyMinutes)) {
        return null;
    }

    if (remainingMinutes <= 0) {
        return new Date();
    }

    if (dailyMinutes <= 0) {
        return null;
    }

    const daysRequired = calculateDaysRequired(remainingMinutes, dailyMinutes);
    const completionDate = new Date();
    completionDate.setHours(0, 0, 0, 0);
    completionDate.setDate(completionDate.getDate() + daysRequired - 1);

    return completionDate;
}

export function calculateVideosPerDay(
    remainingVideos: number,
    daysRequired: number,
): number {
    if (!Number.isFinite(remainingVideos) || !Number.isFinite(daysRequired)) {
        return 0;
    }

    if (remainingVideos <= 0 || daysRequired <= 0) {
        return 0;
    }

    return remainingVideos / daysRequired;
}
