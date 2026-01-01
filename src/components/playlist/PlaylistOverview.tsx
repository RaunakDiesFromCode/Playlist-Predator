import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Props {
    totalVideos: number;
    watchedVideos: number;
    totalDuration: string;
    remainingDuration: string;
}

function parseToSeconds(time: string) {
    const parts = time.split(":").map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return parts[0];
}

function format(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const speeds = [
    { label: "1×", value: 1 },
    { label: "1.25×", value: 1.25 },
    { label: "1.5×", value: 1.5 },
    { label: "2×", value: 2 },
];

const PlaylistOverview = ({
    totalVideos,
    watchedVideos,
    totalDuration,
    remainingDuration,
}: Props) => {
    const progressPercent =
        totalVideos === 0 ? 0 : Math.round((watchedVideos / totalVideos) * 100);

    const remainingSeconds = parseToSeconds(remainingDuration);

    const finishTonight = remainingSeconds / 3600 <= 6; // soft human threshold

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Reality Check</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                            {watchedVideos} / {totalVideos} videos
                        </span>
                        <span>{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} />
                </div>

                {/* Time summary */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Total length</p>
                        <p className="font-medium">{totalDuration}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Still left</p>
                        <p className="font-medium">{remainingDuration}</p>
                    </div>
                </div>

                <Separator />

                {/* Speed-adjusted escape routes */}
                <div className="space-y-3">
                    <p className="text-sm font-medium">If you speed up</p>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {speeds.map((s) => (
                            <div
                                key={s.value}
                                className="flex justify-between rounded-md border px-3 py-2"
                            >
                                <span className="text-muted-foreground">
                                    {s.label}
                                </span>
                                <span className="font-medium">
                                    {format(remainingSeconds / s.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Human verdict */}
                <div className="flex items-start gap-2">
                    {finishTonight ? (
                        <Badge variant="secondary">Doable today</Badge>
                    ) : (
                        <Badge variant="destructive">Long commitment</Badge>
                    )}

                    <p className="text-sm text-muted-foreground">
                        {finishTonight
                            ? "You can realistically finish this today if you stay focused."
                            : "This playlist needs multiple sessions. Consider prioritizing key videos."}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default PlaylistOverview;
