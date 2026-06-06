import Link from "next/link";
import { BarChart3, CheckCircle2, Clock3, ListVideo } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState() {
    return (
        <Card className="border-dashed bg-muted/30">
            <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-none border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                        <BarChart3 className="h-3.5 w-3.5" />
                        No insights yet
                    </div>
                    <p className="max-w-xl text-lg font-medium leading-7 sm:text-xl">
                        Analyze a playlist and start tracking videos to
                        unlock your insights dashboard.
                    </p>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                        Once you begin marking videos as completed, skipped,
                        or to rewatch, you&apos;ll see completion rates,
                        progress breakdowns, playlist rankings, and learning
                        insights here.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-none border bg-background p-4">
                        <ListVideo className="mb-2 h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium">
                            Track Progress
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Mark videos as done, skipped, or to rewatch
                        </p>
                    </div>
                    <div className="rounded-none border bg-background p-4">
                        <CheckCircle2 className="mb-2 h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium">
                            View Breakdowns
                        </p>
                        <p className="text-xs text-muted-foreground">
                            See completion rates and status distributions
                        </p>
                    </div>
                    <div className="rounded-none border bg-background p-4">
                        <Clock3 className="mb-2 h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium">
                            Review Activity
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Track recent updates across playlists
                        </p>
                    </div>
                </div>

                <div>
                    <Button asChild className="shadow-sm">
                        <Link href="/">Analyze a playlist</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
