import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { VideoMetadata } from "@/types/playlist";
import { VideoProgress, VideoStatus } from "@/types/progress";

import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Props {
    video: VideoMetadata;
    progressEntry?: VideoProgress;
    onStatusChange: (id: string, status: VideoStatus) => void;
    playlistId?: string;
}

/* ---------------- UI STATUS LAYER ---------------- */

const UI_STATUS_OPTIONS = ["DONE", "STUDY", "REWATCH", "SKIP"] as const;
type UIStatus = (typeof UI_STATUS_OPTIONS)[number];

// Map UI → backend
const UI_TO_BACKEND: Record<UIStatus, VideoStatus> = {
    DONE: "DONE",
    SKIP: "SKIP",
    STUDY: "NONE",
    REWATCH: "REWATCH",
};

// Map backend → UI (for Select value)
function backendToUI(status: VideoStatus): UIStatus {
    if (status === "NONE") return "STUDY";
    if (status === "REWATCH") return "REWATCH";
    return status;
}

/* ---------------- STYLES ---------------- */

const STATUS_STYLES: Record<UIStatus, { trigger: string; item: string }> = {
    DONE: {
        trigger: "bg-green-500/15 text-green-600 border-green-500/30",
        item: "text-green-600 focus:bg-green-500/15",
    },
    STUDY: {
        trigger: "bg-blue-500/15 text-blue-600 border-blue-500/30",
        item: "text-blue-600 focus:bg-blue-500/15",
    },
    REWATCH: {
        trigger: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
        item: "text-yellow-600 focus:bg-yellow-500/15",
    },
    SKIP: {
        trigger: "bg-red-500/15 text-red-600 border-red-500/30",
        item: "text-red-600 focus:bg-red-500/15",
    },
};

function formatCompletionDate(value?: string) {
    if (!value) return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;

    const today = new Date();
    const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );
    const startOfThatDay = new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate(),
    );

    const dayDiff = Math.round(
        (startOfToday.getTime() - startOfThatDay.getTime()) /
            (1000 * 60 * 60 * 24),
    );

    if (dayDiff === 0) return "Today";
    if (dayDiff === 1) return "Yesterday";

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
    }).format(parsed);
}

/* ---------------- COMPONENT ---------------- */

const PlaylistVideoCard = ({
    video,
    progressEntry,
    onStatusChange,
    playlistId,
}: Props) => {
    const currentStatus = progressEntry?.status ?? "NONE";
    const uiValue = backendToUI(currentStatus);
    const completionLabel = formatCompletionDate(progressEntry?.updatedAt);
    const href =
        video.watchUrl ??
        (playlistId
            ? `https://www.youtube.com/watch?v=${video.videoId}&list=${playlistId}`
            : `https://youtube.com/watch?v=${video.videoId}`);

    return (
        <Card
            className={`group flex flex-col gap-3 p-3 transition-colors backdrop-blur-sm md:flex-row md:items-center ${
                currentStatus === "DONE" ||
                currentStatus === "SKIP" ||
                currentStatus === "REWATCH"
                    ? "opacity-60"
                    : ""
            }`}
        >
            {/* Clickable content */}
            <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-start gap-3 min-w-0 md:flex-1 md:items-center"
            >
                {/* Thumbnail */}
                <div className="relative w-[96px] aspect-video flex-shrink-0 overflow-hidden rounded-md bg-black/10 md:w-[120px]">
                    <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover"
                    />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium leading-snug line-clamp-2">
                        {video.title}
                    </p>
                    <p className="text-sm text-foreground/70 line-clamp-1">
                        {video.channelTitle} · {video.durationFormatted}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {currentStatus === "DONE"
                            ? "Completed"
                            : currentStatus === "REWATCH"
                              ? "Rewatch"
                              : currentStatus === "SKIP"
                                ? "Skipped"
                                : "Study"}
                        {completionLabel ? ` · ${completionLabel}` : ""}
                    </p>
                </div>
            </Link>

            {/* Status Select */}
            <Select
                value={uiValue}
                onValueChange={(value) => {
                    const backendStatus = UI_TO_BACKEND[value as UIStatus];

                    onStatusChange(video.videoId, backendStatus);
                }}
            >
                <SelectTrigger
                    className={`h-8 w-full border text-xs font-bold md:w-[120px] ${STATUS_STYLES[uiValue].trigger}`}
                >
                    <SelectValue />
                </SelectTrigger>

                <SelectContent>
                    <SelectGroup>
                        {UI_STATUS_OPTIONS.map((status) => (
                            <SelectItem
                                key={status}
                                value={status}
                                className={`cursor-pointer font-semibold ${STATUS_STYLES[status].item}`}
                            >
                                {status}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </Card>
    );
};

export default PlaylistVideoCard;
