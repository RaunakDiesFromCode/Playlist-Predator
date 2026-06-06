import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PlaylistInsights } from "@/lib/insights/insights-types";

type PlaylistProgressProps = {
    data: PlaylistInsights[];
};

export function PlaylistProgress({ data }: PlaylistProgressProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Playlist Progress</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Your completion percentage per playlist.
                </p>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[360px] pr-4">
                    <div className="space-y-4">
                        {data.map((playlist) => (
                            <div
                                key={playlist.playlistId}
                                className="space-y-2"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="truncate text-sm font-medium">
                                        {playlist.title ?? playlist.playlistId}
                                    </p>
                                    <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                                        {playlist.completionRate}%
                                    </p>
                                </div>
                                <Progress
                                    value={playlist.completionRate}
                                    className="h-2"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {playlist.completedVideos} of{" "}
                                    {playlist.trackedVideos} videos completed
                                </p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
