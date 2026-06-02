"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/time/duration";
import { PlaylistResumeTarget } from "@/lib/playlist/resume";

type ResumeWatchingPanelProps = {
    target: PlaylistResumeTarget | null;
    className?: string;
};

export default function ResumeWatchingPanel({
    target,
    className,
}: ResumeWatchingPanelProps) {
    if (!target) {
        return null;
    }

    const hasFinished = target.isComplete;
    const actionLabel = hasFinished ? "Rewatch" : "Resume";

    return (
        <div
            className={cn("rounded-md border bg-muted/20 px-3 py-3", className)}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {hasFinished
                                ? "Playlist complete"
                                : "Resume Watching"}
                        </p>
                    </div>

                    <p className="line-clamp-1 text-sm font-medium">
                        {hasFinished
                            ? "You have finished this playlist"
                            : target.video.title}
                    </p>

                    <p className="text-xs text-muted-foreground md:hidden">
                        {hasFinished
                            ? "Jump back to the first item and review it again."
                            : `${target.remainingCount} item${target.remainingCount === 1 ? "" : "s"} left · ${formatDuration(target.remainingDurationSeconds)}`}
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center">
                    <Badge
                        variant="secondary"
                        className="h-5 px-2 text-[10px] w-full rounded-b-none rounded-t-sm"
                    >
                        {target.remainingCount} left
                    </Badge>
                    <Button asChild size="sm" className="shrink-0 gap-1.5 rounded-t-none rounded-b-sm">
                        <Link
                            href={target.href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {hasFinished ? (
                                <RotateCcw className="h-4 w-4" />
                            ) : (
                                <ArrowRight className="h-4 w-4" />
                            )}
                            {actionLabel}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
