"use client";

import { useRef } from "react";
import { PlaylistMeta, VideoMetadata } from "@/types/playlist";
import { PlaylistProgress, VideoStatus } from "@/types/progress";
import PlaylistVideoCard from "./PlaylistVideoCard";
import Image from "next/image";

interface Props {
    videos: VideoMetadata[];
    progress: PlaylistProgress;
    onStatusChange: (id: string, status: VideoStatus) => void;
    playlist: PlaylistMeta | null;
}

const PlaylistVideoList = ({
    videos,
    progress,
    onStatusChange,
    playlist,
}: Props) => {
    // ✅ Hooks ALWAYS first
    const scrollRef = useRef<HTMLDivElement>(null);
    const ticking = useRef(false);

    if (videos.length === 0) return null;

    const playlistThumbnail = videos[0].thumbnail;

    return (
        <div
            ref={scrollRef}
            className="h-full overflow-y-auto overscroll-contain rounded-xl"
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
            {/* Sticky playlist hero */}
            <div className="sticky top-0 z-0">
                <div className="relative w-full h-[280px] overflow-hidden">
                    <Image
                        src={playlistThumbnail}
                        alt="Playlist cover"
                        width={1200}
                        height={675}
                        priority
                        className="w-full h-full object-cover transition-none"
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
                        <h2 className="text-3xl font-semibold leading-tight line-clamp-2">
                            {playlist?.title}
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            {playlist?.channelTitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Video list */}
            <div className="relative z-10 mt-2 space-y-2 px-1">
                {videos.map((video) => (
                    <PlaylistVideoCard
                        key={video.videoId}
                        video={video}
                        currentStatus={
                            progress[video.videoId]?.status || "STUDY"
                        }
                        onStatusChange={onStatusChange}
                    />
                ))}
            </div>
        </div>
    );
};

export default PlaylistVideoList;
