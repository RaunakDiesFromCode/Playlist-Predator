import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { VideoMetadata } from "@/types/playlist";
import { VideoStatus } from "@/types/progress";

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
    currentStatus: VideoStatus; // DONE | SKIP | NONE
    onStatusChange: (id: string, status: VideoStatus) => void;
}

/* ---------------- UI STATUS LAYER ---------------- */

const UI_STATUS_OPTIONS = ["DONE", "STUDY", "REWATCH", "SKIP"] as const;
type UIStatus = (typeof UI_STATUS_OPTIONS)[number];

// Map UI → backend
const UI_TO_BACKEND: Record<UIStatus, VideoStatus> = {
    DONE: "DONE",
    SKIP: "SKIP",
    STUDY: "NONE",
    REWATCH: "NONE",
};

// Map backend → UI (for Select value)
function backendToUI(status: VideoStatus): UIStatus {
    if (status === "NONE") return "STUDY";
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

/* ---------------- COMPONENT ---------------- */

const PlaylistVideoCard = ({ video, currentStatus, onStatusChange }: Props) => {
    const uiValue = backendToUI(currentStatus);

    return (
        <Card
            className={`group flex items-center gap-3 p-2 transition-colors backdrop-blur-sm ${
                currentStatus === "DONE" || currentStatus === "SKIP"
                    ? "opacity-60"
                    : ""
            }`}
        >
            {/* Clickable content */}
            <Link
                href={`https://youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 flex-1 min-w-0"
            >
                {/* Thumbnail */}
                <div className="relative w-[120px] aspect-video flex-shrink-0 overflow-hidden rounded-md bg-black/10">
                    <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover"
                    />
                </div>

                {/* Text */}
                <div className="min-w-0">
                    <p className="font-medium leading-snug truncate">
                        {video.title}
                    </p>
                    <p className="text-sm text-foreground/70 truncate">
                        {video.channelTitle} · {video.durationFormatted}
                    </p>
                </div>
            </Link>

            {/* Status Select */}
            <Select
                value={uiValue}
                onValueChange={(value) => {
                    const backendStatus = UI_TO_BACKEND[value as UIStatus];

                    // 🔁 If user selects the same logical state → reset to NONE
                    if (backendStatus === "NONE" && currentStatus === "NONE") {
                        onStatusChange(video.videoId, "NONE");
                        return;
                    }

                    onStatusChange(video.videoId, backendStatus);
                }}
            >
                <SelectTrigger
                    className={`w-[120px] h-8 text-xs border font-bold ${STATUS_STYLES[uiValue].trigger}`}
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
