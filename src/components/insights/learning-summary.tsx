import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LearningSummary as LearningSummaryType } from "@/lib/insights/insights-types";

type LearningSummaryProps = {
    data: LearningSummaryType;
};

export function LearningSummary({ data }: LearningSummaryProps) {
    const hasData = data.totalTrackedVideos > 0;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Learning Summary</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Key insights about your learning activity.
                </p>
            </CardHeader>
            <CardContent>
                {!hasData ? (
                    <p className="text-sm text-muted-foreground">
                        Start tracking videos to see your learning insights
                        here.
                    </p>
                ) : (
                    <div className="space-y-3">
                        <div className="rounded-none border border-l-4 border-l-emerald-500 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Top Playlist
                            </p>
                            <p className="mt-1 truncate text-sm font-medium">
                                {data.topPlaylist?.title ??
                                    data.topPlaylist?.playlistId ??
                                    "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {data.topPlaylist?.completionRate ?? 0}%
                                completion rate
                            </p>
                        </div>

                        <div className="rounded-none border border-l-4 border-l-amber-500 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Most Active
                            </p>
                            <p className="mt-1 truncate text-sm font-medium">
                                {data.mostActivePlaylist?.title ??
                                    data.mostActivePlaylist?.playlistId ??
                                    "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {data.mostActivePlaylist?.trackedVideos ?? 0}{" "}
                                videos tracked
                            </p>
                        </div>

                        <div className="rounded-none border border-l-4 border-l-muted-foreground/40 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Overall Completion
                            </p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight">
                                {data.overallCompletionRate}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {data.totalTrackedVideos} videos tracked
                                &middot; {data.videosRemaining} remaining
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
