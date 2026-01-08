import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { VideoMetadata } from "@/types/playlist";
import { VideoStatus } from "@/types/progress";

import { Card } from "../ui/card";
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
    currentStatus: VideoStatus;
    onStatusChange: (id: string, status: VideoStatus) => void;
}

const STATUS_STYLES: Record<VideoStatus, { trigger: string; item: string }> = {
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
const STATUS_OPTIONS: VideoStatus[] = ["DONE", "STUDY", "REWATCH", "SKIP"];

const PlaylistVideoCard = ({ video, currentStatus, onStatusChange }: Props) => {
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
                value={currentStatus}
                onValueChange={(value) =>
                    onStatusChange(video.videoId, value as VideoStatus)
                }
            >
                <SelectTrigger
                    className={`w-[120px] h-8 text-xs border font-bold ${STATUS_STYLES[currentStatus].trigger}`}
                >
                    <SelectValue />
                </SelectTrigger>

                <SelectContent>
                    <SelectGroup>
                        {STATUS_OPTIONS.map((status) => (
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
