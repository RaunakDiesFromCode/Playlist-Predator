import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PlaylistProgress } from "@/types/progress";

/* ===================== PROPS ===================== */

interface Props {
    totalVideos: number;
    doneVideos: number;
    rewatchVideos: number;
    skippedVideos: number;
    totalDuration: string;
    remainingDuration: string;
    progress: PlaylistProgress;
}

/* ===================== CONSTANTS ===================== */

// brutally realistic assumptions
const NOTE_TAKING_OVERHEAD = 0.25; // +25% time
const DAILY_END_HOUR = 24; // midnight

const speeds = [
    { label: "1×", value: 1 },
    { label: "1.25×", value: 1.25 },
    { label: "1.5×", value: 1.5 },
    { label: "2×", value: 2 },
    { label: "3×", value: 3 },
    { label: "4×", value: 4 },
];

/* ===================== HELPERS ===================== */

function parseToSeconds(time: string) {
    const parts = time.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0];
}

function format(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function recommendSpeed(seconds: number) {
    if (seconds <= 2 * 3600) return 1;
    if (seconds <= 6 * 3600) return 1.25;
    if (seconds <= 12 * 3600) return 1.5;
    return 2;
}

function getRemainingHoursToday() {
    const now = new Date();
    const hoursLeft = DAILY_END_HOUR - (now.getHours() + now.getMinutes() / 60);
    return Math.max(0, hoursLeft);
}

function getDynamicInsight(
    remainingSeconds: number,
    recommendedSpeed: number,
    untouchedVideos: number,
) {
    const watchSeconds = remainingSeconds / recommendedSpeed;
    const hours = watchSeconds / 3600;

    let scope: string;
    if (hours < 1) scope = "light";
    else if (hours < 3) scope = "moderate";
    else scope = "heavy";

    let fragmentation: string;
    if (untouchedVideos <= 5) fragmentation = "compact";
    else if (untouchedVideos <= 15) fragmentation = "fragmented";
    else fragmentation = "scattered";

    let strategy: string;
    if (scope === "light" && fragmentation === "compact") {
        strategy = "one clean sitting";
    } else if (scope === "moderate") {
        strategy = "two focused sessions";
    } else {
        strategy = "multiple short sessions";
    }

    return {
        watchTime: format(watchSeconds),
        scope,
        fragmentation,
        strategy,
    };
}

function toDayKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
    ).padStart(2, "0")}`;
}

function formatHeatmapDate(date: Date) {
    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
    }).format(date);
}

function getIntensityClass(count: number) {
    if (count <= 0) return "bg-muted/50";
    if (count === 1) return "bg-green-950/80";
    if (count === 2) return "bg-green-800/80";
    if (count === 3) return "bg-green-600/80";
    return "bg-green-300/90";
}

/* ===================== COMPONENT ===================== */

const PlaylistOverview = ({
    totalVideos,
    doneVideos,
    rewatchVideos,
    skippedVideos,
    totalDuration,
    remainingDuration,
    progress,
}: Props) => {
    const remainingSeconds = parseToSeconds(remainingDuration);
    const recommendedSpeed = recommendSpeed(remainingSeconds);

    /* ---------- commitment math ---------- */

    const hoursLeftToday = getRemainingHoursToday();

    const effectiveStudySeconds =
        (remainingSeconds / recommendedSpeed) * (1 + NOTE_TAKING_OVERHEAD);

    const effectiveStudyHours = effectiveStudySeconds / 3600;

    const canFinishToday = effectiveStudyHours <= hoursLeftToday;

    /* ---------- progress math ---------- */

    const donePercent =
        totalVideos === 0 ? 0 : (doneVideos / totalVideos) * 100;

    const rewatchPercent =
        totalVideos === 0 ? 0 : (rewatchVideos / totalVideos) * 100;

    const skippedPercent =
        totalVideos === 0 ? 0 : (skippedVideos / totalVideos) * 100;

    const untouchedVideos =
        totalVideos - doneVideos - rewatchVideos - skippedVideos;

    const insight = getDynamicInsight(
        remainingSeconds,
        recommendedSpeed,
        untouchedVideos,
    );

    const completedPercent =
        totalVideos === 0
            ? 0
            : ((doneVideos + rewatchVideos) / totalVideos) * 100;

    const completionEntries = Object.values(progress)
        .filter((entry) => entry.status === "DONE")
        .filter((entry) => entry.updatedAt);

    const today = new Date();
    const heatmapDays = Array.from({ length: 56 }, (_, index) => {
        const date = new Date(today);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (55 - index));
        return date;
    });

    const dailyCompletionCounts = heatmapDays.reduce<Record<string, number>>(
        (acc, date) => {
            acc[toDayKey(date)] = 0;
            return acc;
        },
        {},
    );

    for (const entry of completionEntries) {
        const completedAt = new Date(entry.updatedAt as string);
        if (Number.isNaN(completedAt.getTime())) continue;

        const key = toDayKey(completedAt);
        if (key in dailyCompletionCounts) {
            dailyCompletionCounts[key] += 1;
        }
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                <CardTitle className="text-lg">Reality Check</CardTitle>
                <Badge variant="secondary" className="whitespace-nowrap">
                    {doneVideos}/{totalVideos} done
                </Badge>
            </CardHeader>

            <CardContent className="space-y-4 md:space-y-6">
                {/* ================= PROGRESS BAR ================= */}

                <div className="space-y-2">
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="absolute left-0 top-0 h-full bg-green-500/80"
                            style={{ width: `${donePercent}%` }}
                        />
                        <div
                            className="absolute top-0 h-full bg-yellow-500/80"
                            style={{
                                left: `${donePercent}%`,
                                width: `${rewatchPercent}%`,
                            }}
                        />
                        <div
                            className="absolute top-0 h-full bg-red-500/80"
                            style={{
                                left: `${donePercent + rewatchPercent}%`,
                                width: `${skippedPercent}%`,
                            }}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge className="whitespace-nowrap bg-green-500/80">
                            DONE ({doneVideos})
                        </Badge>
                        <Badge className="whitespace-nowrap bg-yellow-500/80 text-yellow-950">
                            Rewatch ({rewatchVideos})
                        </Badge>
                        <Badge className="whitespace-nowrap bg-red-500/80">
                            Skipped ({skippedVideos})
                        </Badge>
                        <Badge className="whitespace-nowrap bg-muted text-muted-foreground">
                            Remaining ({untouchedVideos})
                        </Badge>
                    </div>
                </div>

                {/* ================= TIME SUMMARY ================= */}

                <div className="w-full flex  gap-4 text-sm md:flex-row">
                    <div className="w-full">
                        <p className="text-muted-foreground">Total length</p>
                        <p className="font-medium">{totalDuration}</p>
                    </div>

                    <div className="w-full">
                        <p className="text-muted-foreground">Still left</p>
                        <p className="font-medium">{remainingDuration}</p>
                    </div>

                    <div className="w-full flex items-center md:justify-end gap-2">
                        <div>
                            <p className="text-muted-foreground leading-4">
                                You have
                                <br />
                                completed
                            </p>
                        </div>
                        <div className="flex items-end gap-1">
                            <p className="font-bold text-4xl">
                                {completedPercent.toFixed(0)}
                            </p>
                            <p>%</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* ================= SPEED OPTIONS ================= */}

                <div className="space-y-3">
                    <p className="text-sm font-medium">Fastest sane options</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {speeds.map((s) => {
                            const isRecommended = s.value === recommendedSpeed;

                            return (
                                <div
                                    key={s.value}
                                    className={cn(
                                        "flex items-center justify-between rounded-md border px-3 py-2.5",
                                        isRecommended &&
                                            "border-primary bg-primary/10",
                                    )}
                                >
                                    <span className="text-muted-foreground">
                                        {s.label}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {format(remainingSeconds / s.value)}
                                        </span>

                                        {isRecommended && (
                                            <Badge variant="secondary">
                                                Recommended
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Separator />

                {/* ================= QUICK INSIGHTS ================= */}

                <div className="space-y-3 text-sm">
                    <p className="font-medium">Quick insights</p>

                    <div className="space-y-3 md:hidden">
                        <div className="flex gap-3">
                            <div className="min-w-0 flex-1 rounded-md border px-3 py-2.5">
                                <p className="text-xs text-muted-foreground">Today</p>
                                <p
                                    className={cn(
                                        "font-medium",
                                        canFinishToday
                                            ? "text-green-600"
                                            : "text-red-600",
                                    )}
                                >
                                    {canFinishToday ? "Fits" : "Overflows"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {effectiveStudyHours.toFixed(1)}h needed · {hoursLeftToday.toFixed(1)}h left
                                </p>
                            </div>

                            <div className="min-w-0 rounded-md border px-3 py-2.5">
                                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                    <span>Heatmap</span>
                                    <span>56d</span>
                                </div>
                                <div className="overflow-x-auto pb-1">
                                    <div className="grid w-max grid-cols-7 gap-1.5">
                                        {heatmapDays.map((date) => {
                                            const count =
                                                dailyCompletionCounts[toDayKey(date)] ?? 0;

                                            return (
                                                <div
                                                    key={toDayKey(date)}
                                                    title={`${formatHeatmapDate(date)} · ${count} completed`}
                                                    className={`h-2.5 w-2.5 rounded-sm ${getIntensityClass(count)}`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border px-3 py-2.5">
                            <p className="text-xs text-muted-foreground">Friction</p>
                            <p className="font-medium">+{(NOTE_TAKING_OVERHEAD * 100).toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">Notes & pauses</p>
                        </div>

                        <div className="rounded-md border px-3 py-2.5">
                            <p className="text-muted-foreground">
                                At{" "}
                                <span className="font-medium">{recommendedSpeed}×</span>
                                , you have{" "}
                                <span className="font-medium">{insight.watchTime}</span>{" "}
                                of video left across{" "}
                                <span className="font-medium">{untouchedVideos}</span>{" "}
                                videos.
                            </p>

                            <p className="text-muted-foreground">
                                This is a{" "}
                                <span className="font-medium">{insight.scope}</span>
                                ,{" "}
                                <span className="font-medium">{insight.fragmentation}</span>{" "}
                                workload — best handled as{" "}
                                <span className="font-medium">{insight.strategy}</span>
                                .
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:flex gap-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-md border px-3 py-2.5">
                                <p className="text-xs text-muted-foreground">
                                    Today
                                </p>
                                <p
                                    className={cn(
                                        "font-medium",
                                        canFinishToday
                                            ? "text-green-600"
                                            : "text-red-600",
                                    )}
                                >
                                    {canFinishToday ? "Fits" : "Overflows"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {effectiveStudyHours.toFixed(1)}h needed ·{" "}
                                    {hoursLeftToday.toFixed(1)}h left
                                </p>
                            </div>

                            <div className="rounded-md border px-3 py-2.5">
                                <p className="text-xs text-muted-foreground">
                                    Friction
                                </p>
                                <p className="font-medium">
                                    +{(NOTE_TAKING_OVERHEAD * 100).toFixed(0)}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Notes & pauses
                                </p>
                            </div>

                            <div className="sm:col-span-2 rounded-md border px-3 py-2.5">
                                <p className="text-muted-foreground">
                                    At{" "}
                                    <span className="font-medium">
                                        {recommendedSpeed}×
                                    </span>
                                    , you have{" "}
                                    <span className="font-medium">
                                        {insight.watchTime}
                                    </span>{" "}
                                    of video left across{" "}
                                    <span className="font-medium">
                                        {untouchedVideos}
                                    </span>{" "}
                                    videos.
                                </p>

                                <p className="text-muted-foreground">
                                    This is a{" "}
                                    <span className="font-medium">
                                        {insight.scope}
                                    </span>
                                    ,{" "}
                                    <span className="font-medium">
                                        {insight.fragmentation}
                                    </span>{" "}
                                    workload — best handled as{" "}
                                    <span className="font-medium">
                                        {insight.strategy}
                                    </span>
                                    .
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 w-fit">
                            {heatmapDays.map((date) => {
                                const count =
                                    dailyCompletionCounts[toDayKey(date)] ?? 0;

                                return (
                                    <div
                                        key={toDayKey(date)}
                                        title={`${formatHeatmapDate(date)} · ${count} completed`}
                                        className={`h-2.5 w-2.5 rounded-sm ${getIntensityClass(count)}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PlaylistOverview;
