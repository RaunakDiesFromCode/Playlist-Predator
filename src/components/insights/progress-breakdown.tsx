import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressBreakdown as ProgressBreakdownType } from "@/lib/insights/insights-types";

type ProgressBreakdownProps = {
    data: ProgressBreakdownType;
};

export function ProgressBreakdown({ data }: ProgressBreakdownProps) {
    const total = data.done + data.skip + data.rewatch + data.remaining;
    const denominator = Math.max(total, 1);

    const donePct = (data.done / denominator) * 100;
    const skipPct = (data.skip / denominator) * 100;
    const rewatchPct = (data.rewatch / denominator) * 100;
    const remainingPct = 100 - donePct - skipPct - rewatchPct;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Progress Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Your current status mix across tracked videos.
                </p>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="h-3 overflow-hidden rounded-none bg-muted">
                    <div className="flex h-full w-full">
                        <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${donePct}%` }}
                        />
                        <div
                            className="h-full bg-rose-500"
                            style={{ width: `${skipPct}%` }}
                        />
                        <div
                            className="h-full bg-amber-500"
                            style={{ width: `${rewatchPct}%` }}
                        />
                        <div
                            className="h-full bg-muted-foreground/30"
                            style={{ width: `${remainingPct}%` }}
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 rounded-none border border-l-4 border-l-emerald-500 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">Completed</p>
                            <p className="text-sm tabular-nums text-muted-foreground">
                                {data.done}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {Math.round(donePct)}% of tracked videos
                        </p>
                    </div>

                    <div className="space-y-2 rounded-none border border-l-4 border-l-rose-500 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">Skipped</p>
                            <p className="text-sm tabular-nums text-muted-foreground">
                                {data.skip}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {Math.round(skipPct)}% of tracked videos
                        </p>
                    </div>

                    <div className="space-y-2 rounded-none border border-l-4 border-l-amber-500 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">Rewatch</p>
                            <p className="text-sm tabular-nums text-muted-foreground">
                                {data.rewatch}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {Math.round(rewatchPct)}% of tracked videos
                        </p>
                    </div>

                    <div className="space-y-2 rounded-none border border-l-4 border-l-muted-foreground/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">Remaining</p>
                            <p className="text-sm tabular-nums text-muted-foreground">
                                {data.remaining}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {Math.round(remainingPct)}% of tracked videos
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
