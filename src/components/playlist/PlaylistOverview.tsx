import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useIsMounted } from "@/hooks/use-mounted";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaylistMeta, VideoMetadata } from "@/types/playlist";
import { PlaylistProgress } from "@/types/progress";
import {
    calculateSpeedAdjustedMinutes,
    FASTEST_SANE_SPEEDS,
} from "@/lib/planner/planner";
import { getPlaylistResumeTarget } from "@/lib/playlist/resume";
import {
    buildPlaylistCsvExport,
    buildPlaylistJsonExport,
} from "@/lib/export";
import ResumeWatchingPanel from "./ResumeWatchingPanel";
import { toast } from "sonner";

/* ===================== PROPS ===================== */

interface Props {
    playlist: PlaylistMeta | null;
    videos: VideoMetadata[];
    totalVideos: number;
    doneVideos: number;
    rewatchVideos: number;
    skippedVideos: number;
    totalDuration: string;
    remainingDuration: string;
    progress: PlaylistProgress;
    preferredSpeed: number;
    onPreferredSpeedChange: (speed: number) => void;
}

/* ===================== CONSTANTS ===================== */

// brutally realistic assumptions
const NOTE_TAKING_OVERHEAD = 0.25; // +25% time
const DAILY_END_HOUR = 24; // midnight

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
    selectedSpeed: number,
    untouchedVideos: number,
) {
    const watchSeconds =
        calculateSpeedAdjustedMinutes(remainingSeconds / 60, selectedSpeed) *
        60;
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

function pickVariant(key: string, variants: string[]) {
    const hash = key
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return variants[hash % variants.length];
}

function getQuickInsightCopy({
    selectedSpeed,
    recommendedSpeed,
    watchTime,
    untouchedVideos,
    scope,
    fragmentation,
    strategy,
}: {
    selectedSpeed: number;
    recommendedSpeed: number;
    watchTime: string;
    untouchedVideos: number;
    scope: string;
    fragmentation: string;
    strategy: string;
}) {
    const summary = pickVariant(
        `${selectedSpeed}-${watchTime}-${untouchedVideos}`,
        [
            `At ${selectedSpeed}×, you have ${watchTime} of video left across ${untouchedVideos} videos.`,
            `At ${selectedSpeed}× speed, ${watchTime} of video remains across ${untouchedVideos} videos.`,
            `Running at ${selectedSpeed}× leaves ${watchTime} of video across ${untouchedVideos} videos.`,
            `${untouchedVideos} videos are still untouched, totaling ${watchTime} at ${selectedSpeed}× playback.`,
            `With playback set to ${selectedSpeed}×, you'll need about ${watchTime} to finish ${untouchedVideos} remaining videos.`,
            `You're looking at ${watchTime} of remaining content spread across ${untouchedVideos} videos at ${selectedSpeed}×.`,
            `At your current pace of ${selectedSpeed}×, the remaining ${untouchedVideos} videos add up to ${watchTime}.`,
            `${watchTime} of content still remains across ${untouchedVideos} videos when watched at ${selectedSpeed}×.`,
            `Finishing the last ${untouchedVideos} videos will take roughly ${watchTime} at ${selectedSpeed}× speed.`,
            `The untouched queue sits at ${untouchedVideos} videos, with around ${watchTime} left at ${selectedSpeed}×.`,
            `At ${selectedSpeed}× playback, the backlog comes down to ${watchTime} over ${untouchedVideos} videos.`,
            `Your remaining watch stack is ${untouchedVideos} videos long, totaling ${watchTime} at ${selectedSpeed}×.`,
        ],
    );

    const recommendation =
        selectedSpeed === recommendedSpeed
            ? `You're already at the recommended pace of ${recommendedSpeed}×.`
            : `Recommended pace is ${recommendedSpeed}× if you want the safest default.`;

    const workload = pickVariant(`${scope}-${fragmentation}-${strategy}`, [
        `This is a ${scope}, ${fragmentation} workload — best handled as ${strategy}.`,
        `That makes it a ${scope}, ${fragmentation} workload, and ${strategy} is the cleanest way through it.`,
        `Overall: ${scope} workload, ${fragmentation} spread — plan on ${strategy}.`,
        `You're dealing with a ${scope} workload with ${fragmentation} distribution, so ${strategy} makes the most sense.`,
        `Given the ${scope} scope and ${fragmentation} structure, ${strategy} is the safest approach.`,
        `This workload leans ${scope} and ${fragmentation}, meaning ${strategy} should keep things manageable.`,
        `The combination of ${scope} volume and ${fragmentation} spread points toward ${strategy}.`,
        `Because the workload is ${scope} and fairly ${fragmentation}, ${strategy} is probably your best route.`,
        `A ${scope}, ${fragmentation} setup like this usually works best with ${strategy}.`,
        `Considering the ${fragmentation} spread and ${scope} scale, you'd want to approach it as ${strategy}.`,
        `This falls into the ${scope}/${fragmentation} category — treat it as ${strategy}.`,
        `The workload profile here is ${scope} with ${fragmentation} distribution, making ${strategy} the ideal plan.`,
    ]);

    return { summary, workload: `${recommendation} ${workload}` };
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

function getIntensityClass(count: number, maxCount: number) {
    if (count <= 0) return "bg-muted/50";

    if (maxCount <= 1) {
        return "bg-green-300/90";
    }

    const intensity = count / maxCount;

    if (intensity <= 0.25) return "bg-green-950/80";
    if (intensity <= 0.5) return "bg-green-800/80";
    if (intensity <= 0.75) return "bg-green-600/80";
    return "bg-green-300/90";
}

function getHeatmapTooltipLabel(date: Date, count: number) {
    return `${formatHeatmapDate(date)} · ${count} completed`;
}

/* ===================== COMPONENT ===================== */

const PlaylistOverview = ({
    playlist,
    videos,
    totalVideos,
    doneVideos,
    rewatchVideos,
    skippedVideos,
    totalDuration,
    remainingDuration,
    progress,
    preferredSpeed,
    onPreferredSpeedChange,
}: Props) => {
    const isMounted = useIsMounted();
    const remainingSeconds = parseToSeconds(remainingDuration);
    const recommendedSpeed = recommendSpeed(remainingSeconds);
    const selectedSpeed = preferredSpeed || recommendedSpeed;

    /* ---------- commitment math ---------- */

    const hoursLeftToday = getRemainingHoursToday();

    const effectiveStudySeconds =
        (remainingSeconds / selectedSpeed) * (1 + NOTE_TAKING_OVERHEAD);

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

    const resumeTarget = getPlaylistResumeTarget(videos, progress);

    const insight = getDynamicInsight(
        remainingSeconds,
        selectedSpeed,
        untouchedVideos,
    );

    const quickInsightCopy = getQuickInsightCopy({
        selectedSpeed,
        recommendedSpeed,
        watchTime: insight.watchTime,
        untouchedVideos,
        scope: insight.scope,
        fragmentation: insight.fragmentation,
        strategy: insight.strategy,
    });

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

    const [copied, setCopied] = useState<"json" | "csv" | null>(null);

    for (const entry of completionEntries) {
        const completedAt = new Date(entry.updatedAt as string);
        if (Number.isNaN(completedAt.getTime())) continue;

        const key = toDayKey(completedAt);
        if (key in dailyCompletionCounts) {
            dailyCompletionCounts[key] += 1;
        }
    }

    const heatmapCounts = heatmapDays.map(
        (date) => dailyCompletionCounts[toDayKey(date)] ?? 0,
    );

    const maxHeatmapCount = Math.max(...heatmapCounts, 0);

    async function handleCopy(format: "json" | "csv") {
        if (!playlist?.title) return;

        const exporter =
            format === "json"
                ? buildPlaylistJsonExport
                : buildPlaylistCsvExport;

        const file = exporter({
            playlist,
            videos,
            progress,
        });

        try {
            await navigator.clipboard.writeText(file.content);

            setCopied(format);

            toast.success(`${format.toUpperCase()} copied to clipboard`, {
                description: file.filename,
            });

            setTimeout(() => {
                setCopied((current) => (current === format ? null : current));
            }, 2000);
        } catch (error) {
            console.error(error);

            toast.error("Failed to copy export");
        }
    }

    return (
        <Card className="h-full flex flex-col justify-center border-none md:border mb-5">
            <CardHeader className="pt-2">
                <CardTitle className="text-lg flex flex-row items-center justify-between gap-3 ">
                    Reality Check
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className="whitespace-nowrap"
                        >
                            {doneVideos}/{totalVideos} done
                        </Badge>

                        {playlist?.title ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-2 px-3"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                        Copy
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="w-44"
                                >
                                    <DropdownMenuLabel>
                                        Copy progress
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={() => handleCopy("json")}
                                    >
                                        JSON
                                        <DropdownMenuShortcut>
                                            .json
                                        </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={() => handleCopy("csv")}
                                    >
                                        CSV
                                        <DropdownMenuShortcut>
                                            .csv
                                        </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 md:space-y-6">
                {/* ================= PROGRESS BAR ================= */}

                <div className="space-y-2">
                    <div className="relative h-3 w-full overflow-hidden rounded-none bg-muted">
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

                <ResumeWatchingPanel target={resumeTarget} />

                <Separator />

                {/* ================= SPEED OPTIONS ================= */}

                <div className="space-y-3">
                    <p className="text-sm font-medium">
                        Select your preferred speed{" "}
                        <span className="text-xs text-muted-foreground">
                            (Recommended: {recommendedSpeed}×)
                        </span>
                    </p>

                    <div className="grid w-full md:grid-flow-col auto-cols-fr gap-2 text-sm grid-cols-2">
                        {FASTEST_SANE_SPEEDS.map((s) => {
                            const isSelected = s.value === selectedSpeed;

                            return (
                                <Button
                                    key={s.value}
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    className="h-auto min-h-11 w-full flex-col items-start gap-0.5 px-3 py-2"
                                    onClick={() =>
                                        onPreferredSpeedChange(s.value)
                                    }
                                >
                                    <span className="flex items-center gap-2">
                                        <span>{s.label}</span>
                                    </span>
                                    <span
                                        className={cn(
                                            "text-xs",
                                            isSelected
                                                ? "text-primary-foreground/80"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        {format(
                                            calculateSpeedAdjustedMinutes(
                                                remainingSeconds / 60,
                                                s.value,
                                            ) * 60,
                                        )}
                                    </span>
                                </Button>
                            );
                        })}
                    </div>
                </div>

                <Separator />

                {/* ================= QUICK INSIGHTS ================= */}

                <TooltipProvider delayDuration={100}>
                    <div className="space-y-3 text-sm">
                        <p className="font-medium">Quick insights</p>

                        <div className="space-y-3 md:hidden">
                            <div className="rounded-none border px-3 py-2.5">
                                <p className="text-xs text-muted-foreground">
                                    Today
                                </p>
                                <p
                                    className={cn(
                                        "font-medium",
                                        !isMounted
                                            ? "text-muted-foreground"
                                            : canFinishToday
                                              ? "text-green-600"
                                              : "text-red-600",
                                    )}
                                >
                                    {!isMounted
                                        ? "—"
                                        : canFinishToday
                                          ? "Fits"
                                          : "Overflows"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {!isMounted
                                        ? "—"
                                        : `${effectiveStudyHours.toFixed(1)}h needed · ${hoursLeftToday.toFixed(1)}h left`}
                                </p>
                            </div>

                            <div className="grid grid-cols-[1fr,1.1fr] gap-3 items-stretch">
                                <div className="flex min-w-0 flex-col gap-3">
                                    <div className="rounded-none border px-3 py-2.5">
                                        <p className="text-xs text-muted-foreground">
                                            Speed
                                        </p>
                                        <p className="font-medium">
                                            {selectedSpeed}×
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {untouchedVideos} videos left
                                        </p>
                                    </div>

                                    <div className="rounded-none border px-3 py-2.5">
                                        <p className="text-xs text-muted-foreground">
                                            Friction
                                        </p>
                                        <p className="font-medium">
                                            +
                                            {(
                                                NOTE_TAKING_OVERHEAD * 100
                                            ).toFixed(0)}
                                            %
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Notes & pauses
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-none border px-3 py-2.5 overflow-x-auto pb-1 justify-center items-center flex">
                                    <div className="grid w-full h-full grid-cols-7 gap-1.5">
                                        {heatmapDays.map((date, index) => {
                                            if (!isMounted) {
                                                return (
                                                    <div
                                                        key={`empty-${index}`}
                                                        className="h-2.5 w-2.5 rounded-none bg-muted/50"
                                                    />
                                                );
                                            }

                                            const count =
                                                dailyCompletionCounts[
                                                    toDayKey(date)
                                                ] ?? 0;

                                            return (
                                                <Tooltip key={toDayKey(date)}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={`h-2.5 w-2.5 rounded-none ${getIntensityClass(count, maxHeatmapCount)}`}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {getHeatmapTooltipLabel(
                                                            date,
                                                            count,
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-none border px-3 py-2.5">
                                <p className="text-muted-foreground">
                                    {quickInsightCopy.summary}
                                </p>

                                <p className="text-muted-foreground">
                                    {quickInsightCopy.workload}
                                </p>
                            </div>
                        </div>

                        <div className="hidden md:flex gap-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded-none border px-3 py-2.5">
                                    <p className="text-xs text-muted-foreground">
                                        Today
                                    </p>
                                    <p
                                        className={cn(
                                            "font-medium",
                                            !isMounted
                                                ? "text-muted-foreground"
                                                : canFinishToday
                                                  ? "text-green-600"
                                                  : "text-red-600",
                                        )}
                                    >
                                        {!isMounted
                                            ? "—"
                                            : canFinishToday
                                              ? "Fits"
                                              : "Overflows"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {!isMounted
                                            ? "—"
                                            : `${effectiveStudyHours.toFixed(1)}h needed · ${hoursLeftToday.toFixed(1)}h left`}
                                    </p>
                                </div>

                                <div className="rounded-none border px-3 py-2.5">
                                    <p className="text-xs text-muted-foreground">
                                        Friction
                                    </p>
                                    <p className="font-medium">
                                        +
                                        {(NOTE_TAKING_OVERHEAD * 100).toFixed(
                                            0,
                                        )}
                                        %
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Notes & pauses
                                    </p>
                                </div>

                                <div className="sm:col-span-2 rounded-none border px-3 py-2.5">
                                    <p className="text-muted-foreground">
                                        {quickInsightCopy.summary}
                                    </p>

                                    <p className="text-muted-foreground">
                                        {quickInsightCopy.workload}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-2.5 w-[50%]">
                                {heatmapDays.map((date, index) => {
                                    if (!isMounted) {
                                        return (
                                            <div
                                                key={`empty-desktop-${index}`}
                                                className="h-2.5 w-2.5 rounded-none bg-muted/50"
                                            />
                                        );
                                    }

                                    const count =
                                        dailyCompletionCounts[toDayKey(date)] ??
                                        0;

                                    return (
                                        <Tooltip key={toDayKey(date)}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`h-2.5 w-2.5 rounded-none ${getIntensityClass(count, maxHeatmapCount)}`}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {getHeatmapTooltipLabel(
                                                    date,
                                                    count,
                                                )}
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
};

export default PlaylistOverview;
