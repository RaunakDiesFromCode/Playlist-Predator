"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpDown, Filter, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PlaylistMeta, VideoMetadata } from "@/types/playlist";
import { PlaylistProgress, VideoStatus } from "@/types/progress";

import PlaylistVideoCard from "./PlaylistVideoCard";

interface Props {
    videos: VideoMetadata[];
    progress: PlaylistProgress;
    onStatusChange: (id: string, status: VideoStatus) => void;
    playlist: PlaylistMeta | null;
}

type SortOption =
    | "default"
    | "az"
    | "za"
    | "length-asc"
    | "length-desc"
    | "status";

const PlaylistVideoList = ({
    videos,
    progress,
    onStatusChange,
    playlist,
}: Props) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const ticking = useRef(false);
    const [query, setQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"ALL" | VideoStatus>(
        "ALL",
    );
    const [sortBy, setSortBy] = useState<SortOption>("default");

    const playlistThumbnail = videos[0]?.thumbnail;

    const filteredVideos = useMemo(() => {
        const lowerQuery = query.trim().toLowerCase();

        const next = videos.filter((video) => {
            const entry = progress[video.videoId];
            const status = entry?.status ?? "NONE";

            if (filterStatus !== "ALL" && status !== filterStatus) {
                return false;
            }

            if (!lowerQuery) return true;

            return (
                video.title.toLowerCase().includes(lowerQuery) ||
                video.channelTitle.toLowerCase().includes(lowerQuery)
            );
        });

        next.sort((a, b) => {
            switch (sortBy) {
                case "az":
                    return a.title.localeCompare(b.title);
                case "za":
                    return b.title.localeCompare(a.title);
                case "length-asc":
                    return a.durationSeconds - b.durationSeconds;
                case "length-desc":
                    return b.durationSeconds - a.durationSeconds;
                default:
                    return a.position - b.position;
            }
        });

        return next;
    }, [filterStatus, progress, query, sortBy, videos]);

    const startedAt = useMemo(() => {
        let earliest: string | null = null;

        for (const entry of Object.values(progress)) {
            if (entry.status !== "DONE" && entry.status !== "REWATCH") continue;
            if (!entry.updatedAt) continue;

            if (!earliest) {
                earliest = entry.updatedAt;
                continue;
            }

            if (
                new Date(entry.updatedAt).getTime() <
                new Date(earliest).getTime()
            ) {
                earliest = entry.updatedAt;
            }
        }

        return earliest;
    }, [progress]);

    const dayNumber = useMemo(() => {
        if (!startedAt) return null;

        const startedDate = new Date(startedAt);
        if (Number.isNaN(startedDate.getTime())) return null;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOfStarted = new Date(startedDate);
        startOfStarted.setHours(0, 0, 0, 0);

        return Math.max(
            1,
            Math.floor(
                (startOfToday.getTime() - startOfStarted.getTime()) /
                    (1000 * 60 * 60 * 24),
            ) + 1,
        );
    }, [startedAt]);

    if (videos.length === 0 || !playlistThumbnail) return null;

    return (
        <div
            ref={scrollRef}
            className="flex h-full flex-col overflow-y-auto overscroll-contain rounded-xl border border-border"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={{ ["--blur" as any]: 0 }}
            onScroll={() => {
                if (ticking.current) return;
                ticking.current = true;

                requestAnimationFrame(() => {
                    const el = scrollRef.current;
                    if (!el) {
                        ticking.current = false;
                        return;
                    }

                    const y = el.scrollTop;
                    const blur = Math.min(y / 25, 12);

                    el.style.setProperty("--blur", blur.toString());
                    ticking.current = false;
                });
            }}
        >
            <div className="sticky top-0 z-0">
                <div className="relative h-[220px] w-full overflow-hidden md:h-[280px]">
                    <Image
                        src={playlistThumbnail}
                        alt="Playlist cover"
                        width={1200}
                        height={675}
                        priority
                        className="h-full w-full object-cover transition-none"
                        style={{
                            filter: "blur(calc(var(--blur, 0) * 1px))",
                            transform: "scale(calc(1 + var(--blur, 0) / 120))",
                        }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

                    <div
                        className="absolute bottom-4 left-4 right-4 transition-none"
                        style={{
                            opacity: "calc(1 - var(--blur, 0) / 5)",
                        }}
                    >
                        {dayNumber ? (
                            <Badge className="mb-2 w-fit border-blue-500/30 bg-blue-500/15 text-blue-600">
                                Day {dayNumber}
                            </Badge>
                        ) : null}
                        <h2 className="text-2xl font-semibold leading-tight line-clamp-2 md:text-3xl">
                            {playlist?.title}
                        </h2>
                        <p className="text-sm text-muted-foreground md:text-lg">
                            {playlist?.channelTitle}
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-2 flex-1 space-y-2 px-1">
                {filteredVideos.map((video) => (
                    <PlaylistVideoCard
                        key={video.videoId}
                        video={video}
                        progressEntry={progress[video.videoId]}
                        onStatusChange={onStatusChange}
                    />
                ))}

                {filteredVideos.length === 0 && (
                    <div className="pt-20 p-6 text-center text-sm text-muted-foreground">
                        No videos match your search or filter.
                    </div>
                )}
            </div>

            <div className="sticky bottom-0 z-20 mt-auto border-t border-border/60 bg-background/95 px-3 py-3 backdrop-blur">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1 lg:flex-[2]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search videos or channels"
                            className="h-9 pl-9"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 lg:w-[280px] lg:flex-none">
                        <Select
                            value={filterStatus}
                            onValueChange={(value) =>
                                setFilterStatus(value as "ALL" | VideoStatus)
                            }
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                    <SelectValue placeholder="Filter" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="ALL">All</SelectItem>
                                    <SelectItem value="DONE">Done</SelectItem>
                                    <SelectItem value="REWATCH">
                                        Rewatch
                                    </SelectItem>
                                    <SelectItem value="SKIP">Skip</SelectItem>
                                    <SelectItem value="NONE">Study</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Select
                            value={sortBy}
                            onValueChange={(value) =>
                                setSortBy(value as SortOption)
                            }
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    <SelectValue placeholder="Sort" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="default">
                                        Default
                                    </SelectItem>
                                    <SelectItem value="az">A to Z</SelectItem>
                                    <SelectItem value="za">Z to A</SelectItem>
                                    <SelectItem value="length-asc">
                                        Length: Shortest
                                    </SelectItem>
                                    <SelectItem value="length-desc">
                                        Length: Longest
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaylistVideoList;
