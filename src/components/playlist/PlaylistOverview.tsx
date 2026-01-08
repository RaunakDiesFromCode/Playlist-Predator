import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ===================== PROPS ===================== */

interface Props {
    totalVideos: number;
    watchedVideos: number;
    skippedVideos: number;
    totalDuration: string;
    remainingDuration: string;
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
        untouchedVideos: number
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

/* ===================== COMPONENT ===================== */

const PlaylistOverview = ({
    totalVideos,
    watchedVideos,
    skippedVideos,
    totalDuration,
    remainingDuration,
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

    const watchedPercent =
        totalVideos === 0 ? 0 : (watchedVideos / totalVideos) * 100;

    const skippedPercent =
        totalVideos === 0 ? 0 : (skippedVideos / totalVideos) * 100;

    const untouchedVideos = totalVideos - watchedVideos - skippedVideos;

    const insight = getDynamicInsight(
        remainingSeconds,
        recommendedSpeed,
        untouchedVideos
    );



    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Reality Check</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* ================= PROGRESS BAR ================= */}

                <div className="space-y-2">
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="absolute left-0 top-0 h-full bg-green-500/80"
                            style={{ width: `${watchedPercent}%` }}
                        />
                        <div
                            className="absolute top-0 h-full bg-red-500/80"
                            style={{
                                left: `${watchedPercent}%`,
                                width: `${skippedPercent}%`,
                            }}
                        />
                    </div>

                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <Badge className="bg-green-500/80">
                            DONE ({watchedVideos})
                        </Badge>
                        <Badge className="bg-red-500/80">
                            Skipped ({skippedVideos})
                        </Badge>
                        <Badge className="bg-muted text-muted-foreground">
                            Remaining ({untouchedVideos})
                        </Badge>
                    </div>
                </div>

                {/* ================= TIME SUMMARY ================= */}

                <div className="w-full flex gap-4 text-sm">
                    <div className="w-full">
                        <p className="text-muted-foreground">Total length</p>
                        <p className="font-medium">{totalDuration}</p>
                    </div>
                    <div className="w-full">
                        <p className="text-muted-foreground">Still left</p>
                        <p className="font-medium">{remainingDuration}</p>
                    </div>
                    <div className="w-full text-right flex justify-end items-center gap-1">
                        <div>
                            <p className="text-muted-foreground leading-4">
                                You have
                                <br />
                                Completed
                            </p>
                        </div>
                        <div className="flex justify-end items-end gap-1">
                            <p className="font-bold text-4xl">
                                {(
                                    ((parseToSeconds(totalDuration) -
                                        parseToSeconds(remainingDuration)) *
                                        100) /
                                    parseToSeconds(totalDuration)
                                ).toFixed(0)}
                            </p>{" "}
                            <p>%</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* ================= SPEED OPTIONS ================= */}

                <div className="space-y-3">
                    <p className="text-sm font-medium">Fastest sane options</p>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {speeds.map((s) => {
                            const isRecommended = s.value === recommendedSpeed;

                            return (
                                <div
                                    key={s.value}
                                    className={cn(
                                        "flex items-center justify-between rounded-md border px-3 py-2",
                                        isRecommended &&
                                            "border-primary bg-primary/10"
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

                    <div className="grid grid-cols-2 gap-3">
                        {/* Time feasibility */}
                        <div className="rounded-md border px-3 py-2">
                            <p className="text-xs text-muted-foreground">
                                Today
                            </p>
                            <p className="font-medium">
                                {canFinishToday ? "Fits" : "Overflows"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {effectiveStudyHours.toFixed(1)}h needed ·{" "}
                                {hoursLeftToday.toFixed(1)}h left
                            </p>
                        </div>

                        {/* Overhead */}
                        <div className="rounded-md border px-3 py-2">
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

                        {/* Dynamic insight */}
                        <div className="col-span-2 rounded-md border px-3 py-2 text-sm">
                            <p className="text-muted-foreground">
                                At{" "}
                                <span className="font-medium">
                                    {recommendedSpeed}×
                                </span>
                                , you have{" "}
                                <span className="font-medium">
                                    {insight.watchTime}
                                </span>{" "}
                                of video left, spread across{" "}
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
                </div>
            </CardContent>
        </Card>
    );
};

export default PlaylistOverview;
