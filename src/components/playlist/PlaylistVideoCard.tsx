import { memo, useCallback } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { useIsMounted } from "@/hooks/use-mounted";
import { VideoMetadata } from "@/types/playlist";
import { VideoProgress, VideoStatus } from "@/types/progress";
import { VideoCrewMember } from "@/types/friends";
import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "../ui/button";

function getMemberAvatarUrl(member: VideoCrewMember) {
    if (member.avatarUrl) return member.avatarUrl;
    return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        member.name || "User",
    )}&radius=0`;
}

interface Props {
    video: VideoMetadata;
    progressEntry?: VideoProgress;
    onStatusChange: (id: string, status: VideoStatus) => void;
    onVideoClick?: (video: VideoMetadata) => void;
    serialNumber: number;
    completedCrew?: VideoCrewMember[];
    currentUserId?: string;
    isMobile?: boolean;
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

const PlaylistVideoCardInner = ({
    video,
    progressEntry,
    onStatusChange,
    onVideoClick,
    serialNumber,
    completedCrew = [],
    currentUserId,
    isMobile = false,
}: Props) => {
    const isMounted = useIsMounted();
    const currentStatus = progressEntry?.status ?? "NONE";
    const uiValue = backendToUI(currentStatus);
    const completionLabel = formatCompletionDate(progressEntry?.updatedAt);

    const maxVisible = isMobile ? 3 : 4;
    const hasOverflow = completedCrew.length > (isMobile ? 4 : 5);
    const visibleMembers = hasOverflow
        ? completedCrew.slice(0, maxVisible)
        : completedCrew;
    const hiddenCount = hasOverflow ? completedCrew.length - maxVisible : 0;

    const handleValueChange = useCallback(
        (value: string) => {
            const backendStatus = UI_TO_BACKEND[value as UIStatus];
            onStatusChange(video.videoId, backendStatus);
        },
        [onStatusChange, video.videoId],
    );

    const handleClick = useCallback(() => {
        onVideoClick?.(video);
    }, [onVideoClick, video]);

    return (
        <Card
            className={`group flex flex-col gap-3 p-3 transition-colors backdrop-blur-sm md:flex-row md:items-center ${
                currentStatus === "DONE" ||
                currentStatus === "SKIP" ||
                currentStatus === "REWATCH"
                    ? "opacity-60 hover:opacity-100"
                    : ""
            }`}
        >
            <div className="flex w-full items-start gap-3 min-w-0 md:flex-1 md:items-center">
                {/* Left pane: Thumbnail + Crew's pfp */}
                <div className="flex flex-col shrink-0 w-[96px] md:w-[120px]">
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={handleClick}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                handleClick();
                            }
                        }}
                        className="relative w-full aspect-video overflow-hidden rounded-none bg-black/10 text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <Image
                            src={video.thumbnail}
                            alt={video.title}
                            fill
                            className="object-cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded-none bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-white">
                            {serialNumber}
                        </span>
                    </div>

                    {/* Crew completed avatars below thumbnail */}
                    {completedCrew.length > 0 && (
                        <div className="mt-1 w-full flex items-center">
                            <TooltipProvider delayDuration={150}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex items-center gap-[2px] max-w-full overflow-hidden text-left cursor-pointer focus:outline-none"
                                            aria-label={`View who completed ${video.title}`}
                                        >
                                            {visibleMembers.map((member) => {
                                                const isSelf =
                                                    member.userId === currentUserId;
                                                return (
                                                    <Tooltip key={member.userId}>
                                                        <TooltipTrigger asChild>
                                                            <Avatar
                                                                className={cn(
                                                                    "h-[18px] w-[18px] shrink-0 rounded-none border select-none transition-colors",
                                                                    isSelf
                                                                        ? "border-emerald-500/70 ring-1 ring-emerald-500/30"
                                                                        : "border-border",
                                                                )}
                                                            >
                                                                <AvatarImage
                                                                    src={getMemberAvatarUrl(
                                                                        member,
                                                                    )}
                                                                    alt={
                                                                        member.name
                                                                    }
                                                                    className="object-cover"
                                                                />
                                                                <AvatarFallback
                                                                    className={cn(
                                                                        "rounded-none font-bold text-[9px]",
                                                                        isSelf
                                                                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                                            : "bg-muted text-foreground/80",
                                                                    )}
                                                                >
                                                                    {member.name
                                                                        .charAt(
                                                                            0,
                                                                        )
                                                                        .toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            side="bottom"
                                                            className="rounded-none text-[11px] py-1 px-2 font-sans"
                                                        >
                                                            <span>
                                                                {member.name}
                                                                {isSelf && " (You)"}
                                                                {member.role === "owner" && " · Host"}
                                                            </span>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}

                                            {hiddenCount > 0 && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className="flex h-[18px] px-1 shrink-0 items-center justify-center rounded-none border border-primary/40 bg-primary/10 font-bold text-[9px] text-primary select-none hover:bg-primary/20 transition-colors"
                                                        >
                                                            +{hiddenCount}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="bottom"
                                                        className="rounded-none text-[11px] py-1 px-2 font-sans"
                                                    >
                                                        <span>
                                                            +{hiddenCount} more crew {hiddenCount === 1 ? "member" : "members"}
                                                        </span>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </button>
                                    </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="start"
                                    className="w-56 rounded-none p-2 space-y-1.5"
                                >
                                    <div className="flex items-center justify-between px-1 text-xs font-semibold text-foreground">
                                        <span>Completed by Crew</span>
                                        <Badge
                                            variant="secondary"
                                            className="rounded-none px-1.5 py-0 text-[10px]"
                                        >
                                            {completedCrew.length}
                                        </Badge>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                                        {completedCrew.map((member) => {
                                            const isSelf =
                                                member.userId === currentUserId;
                                            const formattedDate =
                                                formatCompletionDate(
                                                    member.completedAt ??
                                                        undefined,
                                                );

                                            return (
                                                <div
                                                    key={member.userId}
                                                    className="flex items-center justify-between gap-2 px-1.5 py-1 text-xs bg-muted/40 rounded-none border border-border/50"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Avatar
                                                            className={cn(
                                                                "h-5 w-5 shrink-0 rounded-none border",
                                                                isSelf
                                                                    ? "border-emerald-500/70"
                                                                    : "border-border",
                                                            )}
                                                        >
                                                            <AvatarImage
                                                                src={getMemberAvatarUrl(
                                                                    member,
                                                                )}
                                                                alt={member.name}
                                                                className="object-cover"
                                                            />
                                                            <AvatarFallback
                                                                className={cn(
                                                                    "rounded-none font-bold text-[10px]",
                                                                    isSelf
                                                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                                        : "bg-muted",
                                                                )}
                                                            >
                                                                {member.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="truncate font-medium">
                                                            {member.name}{" "}
                                                            {isSelf && "(You)"}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0 text-[10px]">
                                                        {member.role ===
                                                            "owner" && (
                                                            <span className="text-primary font-medium">
                                                                Host
                                                            </span>
                                                        )}
                                                        {formattedDate && (
                                                            <span className="text-muted-foreground">
                                                                {formattedDate}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TooltipProvider>
                    </div>
                )}
                </div>

                {/* Text (Clickable to play video) */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleClick}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            handleClick();
                        }
                    }}
                    className="min-w-0 flex-1 space-y-1 text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
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
                        {isMounted && completionLabel
                            ? ` ${completionLabel}`
                            : ""}
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <Button className="w-full md:flex hidden" variant="outline" asChild>
                    <a
                        href={
                            video.watchUrl ??
                            `https://www.youtube.com/watch?v=${video.videoId}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full"
                    >
                        Open
                        <ExternalLink className=" h-4 w-4" />
                    </a>
                </Button>

                {/* Status Select */}
                <Select value={uiValue} onValueChange={handleValueChange}>
                    <SelectTrigger
                        className={`h-8 w-full border text-xs font-bold md:w-30 ${STATUS_STYLES[uiValue].trigger}`}
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
            </div>
        </Card>
    );
};

export default memo(PlaylistVideoCardInner);
