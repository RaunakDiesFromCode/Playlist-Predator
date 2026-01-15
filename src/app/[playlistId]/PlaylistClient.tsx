"use client";

import { useEffect, useRef, useState } from "react";
import {
    PlaylistAnalysis,
    PlaylistMeta,
    VideoMetadata,
} from "@/types/playlist";
import PlaylistOverview from "@/components/playlist/PlaylistOverview";
import PlaylistVideoList from "@/components/playlist/PlaylistVideoList";
import { loadProgress } from "@/lib/progress";
import { PlaylistProgress, VideoStatus } from "@/types/progress";
import { formatDuration } from "@/lib/time/duration";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

/* ---------------------------------- */
/* Skeleton */
/* ---------------------------------- */

function PlaylistPageSkeleton() {
    return (
        <div className="flex gap-4 p-4">
            <div className="w-full h-[calc(100dvh-6rem)] overflow-hidden space-y-4">
                <Skeleton className="h-64 w-full rounded-xl" />
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="h-20 w-32 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-full h-[calc(100dvh-6rem)] md:block hidden overflow-y-auto space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
            </div>
        </div>
    );
}

/* ---------------------------------- */
/* Main Component */
/* ---------------------------------- */

export default function PlaylistClient({ playlistId }: { playlistId: string }) {
    const { user, loading: authLoading } = useAuth();

    const [summary, setSummary] = useState<PlaylistAnalysis | null>(null);
    const [videos, setVideos] = useState<VideoMetadata[]>([]);
    const [progress, setProgress] = useState<PlaylistProgress>({});
    const [playlist, setPlaylist] = useState<PlaylistMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isMobile, setIsMobile] = useState(false);
    const savedRef = useRef(false);

    /* ---------------------------------- */
    /* Detect mobile */
    /* ---------------------------------- */

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(mq.matches);

        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    /* ---------------------------------- */
    /* Fetch playlist + progress */
    /* ---------------------------------- */

    useEffect(() => {
        if (!playlistId) return;

        let cancelled = false;

        async function init() {
            try {
                const p = await loadProgress(playlistId);
                if (!cancelled) setProgress(p);

                const res = await fetch("/api/playlist/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        playlistUrl: `https://youtube.com/playlist?list=${playlistId}`,
                    }),
                });

                const data = await res.json();
                if (cancelled) return;

                setSummary(data.summary);
                setVideos(data.videos);
                setPlaylist(data.playlist);
            } catch (err) {
                console.error(err);
                if (!cancelled) setError("Failed to load playlist");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        init();
        return () => {
            cancelled = true;
        };
    }, [playlistId]);

    /* ---------------------------------- */
    /* Save playlist once */
    /* ---------------------------------- */

    useEffect(() => {
        if (authLoading || !user || !playlist || savedRef.current) return;

        savedRef.current = true;

        fetch("/api/playlists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                youtube_playlist_id: playlistId,
                title: playlist.title,
                thumbnail: playlist.thumbnail,
            }),
        }).catch(() => {});
    }, [playlistId, playlist, user, authLoading]);

    /* ---------------------------------- */
    /* Progress update */
    /* ---------------------------------- */

    async function changeStatus(videoId: string, status: VideoStatus) {
        setProgress((prev) => {
            const next = { ...prev };
            if (status === "NONE") delete next[videoId];
            else next[videoId] = { status };
            return next;
        });

        await fetch("/api/progress", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playlistId, videoId, status }),
        });
    }

    /* ---------------------------------- */
    /* States */
    /* ---------------------------------- */

    if (loading) return <PlaylistPageSkeleton />;
    if (error) return <p className="p-8 text-red-500">{error}</p>;
    if (!summary || !playlist) return null;

    const watchedCount = videos.filter(
        (v) => progress[v.videoId]?.status === "DONE"
    ).length;

    const skippedCount = videos.filter(
        (v) => progress[v.videoId]?.status === "SKIP"
    ).length;

    const totalDurationSeconds = videos.reduce(
        (a, v) => a + v.durationSeconds,
        0
    );

    const watchedDuration = videos
        .filter((v) => progress[v.videoId]?.status === "DONE")
        .reduce((a, v) => a + v.durationSeconds, 0);

    const remainingDuration = formatDuration(
        Math.max(totalDurationSeconds - watchedDuration, 0)
    );

    const AnalysisPanel = (
        <PlaylistOverview
            totalVideos={summary.totalVideos}
            watchedVideos={watchedCount}
            skippedVideos={skippedCount}
            totalDuration={summary.totalDuration}
            remainingDuration={remainingDuration}
        />
    );

    /* ---------------------------------- */
    /* Desktop */
    /* ---------------------------------- */

    if (!isMobile) {
        return (
            <div className="flex gap-4 p-4">
                <div className="w-1/2 h-[calc(100dvh-6rem)] overflow-hidden">
                    <PlaylistVideoList
                        videos={videos}
                        progress={progress}
                        onStatusChange={changeStatus}
                        playlist={playlist}
                    />
                </div>

                <div className="w-1/2 h-[calc(100dvh-6rem)] overflow-y-auto">
                    {AnalysisPanel}
                </div>
            </div>
        );
    }

    /* ---------------------------------- */
    /* Mobile (Drawer) */
    /* ---------------------------------- */

    return (
        <div className="p-4 flex flex-col gap-4 h-[calc(100dvh-4rem)]">
            <div className="flex-1 overflow-hidden">
                <PlaylistVideoList
                    videos={videos}
                    progress={progress}
                    onStatusChange={changeStatus}
                    playlist={playlist}
                />
            </div>

            <Drawer>
                <DrawerTrigger className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-medium">
                    View Playlist Analysis
                </DrawerTrigger>

                <DrawerContent className="max-h-[85dvh]">
                    <DrawerHeader>
                        <DrawerTitle>Playlist Analysis</DrawerTitle>
                    </DrawerHeader>

                    <div className="px-4 pb-6 overflow-y-auto">
                        {AnalysisPanel}
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
