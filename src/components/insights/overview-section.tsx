import { CheckCircle2, Clock3, ListVideo, Percent } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { InsightsOverview } from "@/lib/insights/insights-types";

type OverviewSectionProps = {
    data: InsightsOverview;
};

function formatLastActivity(date: Date | null): string {
    if (!date) {
        return "No activity yet";
    }

    const now = new Date();
    const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
    );
    const startOfTarget = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    );
    const dayDiff = Math.round(
        (startOfToday.getTime() - startOfTarget.getTime()) /
            (24 * 60 * 60 * 1000),
    );

    if (dayDiff <= 0) {
        return "Today";
    }

    if (dayDiff === 1) {
        return "Yesterday";
    }

    if (dayDiff < 7) {
        return `${dayDiff} days ago`;
    }

    const weekDiff = Math.round(dayDiff / 7);

    if (weekDiff < 5) {
        return `${weekDiff} weeks ago`;
    }

    const monthDiff = Math.round(dayDiff / 30);

    if (monthDiff < 12) {
        return `${monthDiff} months ago`;
    }

    const yearDiff = Math.round(dayDiff / 365);
    return `${yearDiff} years ago`;
}

export function OverviewSection({ data }: OverviewSectionProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="overflow-hidden">
                <CardContent className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            Playlists Tracked
                        </p>
                        <div className="rounded-none border bg-muted/60 p-2 text-muted-foreground">
                            <ListVideo className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        {data.playlistsTracked}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Playlists you&apos;re learning from
                    </p>
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardContent className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            Videos Completed
                        </p>
                        <div className="rounded-none border bg-muted/60 p-2 text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        {data.videosCompleted}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Videos you&apos;ve finished
                    </p>
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardContent className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            Completion Rate
                        </p>
                        <div className="rounded-none border bg-muted/60 p-2 text-muted-foreground">
                            <Percent className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        {data.completionRate}%
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Completed out of all tracked videos
                    </p>
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardContent className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            Last Active
                        </p>
                        <div className="rounded-none border bg-muted/60 p-2 text-muted-foreground">
                            <Clock3 className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        {formatLastActivity(data.lastActivity)}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Most recent learning session
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
