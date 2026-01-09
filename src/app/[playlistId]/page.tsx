"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    PlaylistAnalysis,
    PlaylistMeta,
    VideoMetadata,
} from "@/types/playlist";
import PlaylistOverview from "@/components/playlist/PlaylistOverview";
import PlaylistVideoList from "@/components/playlist/PlaylistVideoList";
import { loadProgress, updateVideoStatus } from "@/lib/progress";
import { PlaylistProgress } from "@/types/progress";
import { formatDuration } from "@/lib/time/duration";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoStatus } from "@/types/progress";
import { useAuth } from "@/hooks/use-auth";

function PlaylistPageSkeleton() {
    return (
        <div className="flex gap-4 p-4">
            {/* Left panel skeleton */}
            <div className="w-1/2 h-[calc(100dvh-6rem)] overflow-hidden space-y-4">
                {/* Playlist hero */}
                <Skeleton className="h-64 w-full rounded-xl" />

                {/* Video list */}
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

            {/* Right panel skeleton */}
            <div className="w-1/2 h-[calc(100dvh-6rem)] overflow-y-auto space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
            </div>
        </div>
    );
}

export default function PlaylistPage() {
    const raw = useParams().playlistId;
    const playlistId = Array.isArray(raw) ? raw[0] : raw;

    const { user, loading: authLoading } = useAuth();

    const [summary, setSummary] = useState<PlaylistAnalysis | null>(null);
    const [videos, setVideos] = useState<VideoMetadata[]>([]);
    const [progress, setProgress] = useState<PlaylistProgress>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playlist, setPlaylist] = useState<PlaylistMeta | null>(null);
    const savedRef = useRef(false);

    useEffect(() => {
        if (!playlistId) return;

        let cancelled = false;

        async function init() {
            try {
                // 1. Load progress (local OR DB)
                if (!playlistId) return;
                const p = await loadProgress(playlistId);
                if (!cancelled) setProgress(p);

                // 2. Analyze playlist
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

    useEffect(() => {
        if (authLoading) return;
        if (!user) return;
        if (!playlistId || !playlist) return;
        if (savedRef.current) return;

        savedRef.current = true;

        fetch("/api/playlists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                youtube_playlist_id: playlistId,
                title: playlist.title,
                thumbnail: playlist.thumbnail,
            }),
        }).catch(() => {
            // swallow error — sidebar can recover later
        });
    }, [playlistId, playlist, user, authLoading]);

    async function changeStatus(videoId: string, status: VideoStatus) {
        setProgress((prev) => {
            const next = { ...prev };

            if (status === "NONE") {
                delete next[videoId];
            } else {
                next[videoId] = { status };
            }

            return next;
        });

        await fetch("/api/progress", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playlistId, videoId, status }),
        });
    }

    if (loading) return <PlaylistPageSkeleton />;
    if (error) return <p className="p-8 text-red-500">{error}</p>;
    if (!summary) return null;

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

    return (
        <div className="flex  gap-4 p-4 ">
            {/* Left panel */}
            <div className="w-1/2 h-[calc(100dvh-6rem)] overflow-hidden ">
                <PlaylistVideoList
                    videos={videos}
                    progress={progress}
                    onStatusChange={changeStatus}
                    playlist={playlist}
                />
            </div>

            {/* Right panel */}
            <div className="w-1/2 h-[calc(100dvh-6rem)] overflow-y-auto ">
                <PlaylistOverview
                    totalVideos={summary.totalVideos}
                    watchedVideos={watchedCount}
                    skippedVideos={skippedCount}
                    totalDuration={summary.totalDuration}
                    remainingDuration={remainingDuration}
                />
            </div>
        </div>
    );
}
