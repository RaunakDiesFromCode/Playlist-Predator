import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ActivityItem } from "@/lib/insights/insights-types";

type RecentActivityProps = {
    data: ActivityItem[];
};

function formatRelativeTime(date: Date): string {
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

    if (dayDiff < 0) {
        return "Today";
    }

    if (dayDiff === 0) {
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

function getStatusColor(status: ActivityItem["status"]) {
    switch (status) {
        case "DONE":
            return "bg-emerald-500";
        case "SKIP":
            return "bg-rose-500";
        case "REWATCH":
            return "bg-amber-500";
        default:
            return "bg-muted-foreground";
    }
}

function getStatusLabel(status: ActivityItem["status"]) {
    switch (status) {
        case "DONE":
            return "Completed";
        case "SKIP":
            return "Skipped";
        case "REWATCH":
            return "Marked for Rewatch";
        default:
            return "Updated";
    }
}

export function RecentActivity({ data }: RecentActivityProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Your latest progress updates across playlists.
                </p>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[360px] pr-4">
                    <div className="space-y-1">
                        {data.map((item, index) => (
                            <div
                                key={`${item.playlistId}-${item.videoId}-${index}`}
                                className="flex items-start gap-3 rounded-none border p-3"
                            >
                                <span
                                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-none ${getStatusColor(item.status)}`}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm">
                                        <span className="font-medium">
                                            {getStatusLabel(item.status)}
                                        </span>{" "}
                                        <span className="text-muted-foreground">
                                            {item.playlistTitle ?? item.playlistId}
                                        </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatRelativeTime(item.timestamp)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
