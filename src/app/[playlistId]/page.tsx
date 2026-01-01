"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PlaylistAnalysis, PlaylistMeta, VideoMetadata } from "@/types/playlist";
import PlaylistOverview from "@/components/playlist/PlaylistOverview";
import PlaylistVideoList from "@/components/playlist/PlaylistVideoList";
import { loadProgress, saveProgress } from "@/lib/storage/progress";
import { PlaylistProgress } from "@/types/progress";
import { formatDuration } from "@/lib/time/duration";

export default function PlaylistPage() {
    const { playlistId } = useParams<{ playlistId: string }>();

    const [summary, setSummary] = useState<PlaylistAnalysis | null>(null);
    const [videos, setVideos] = useState<VideoMetadata[]>([]);
    const [progress, setProgress] = useState<PlaylistProgress>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playlist, setPlaylist] = useState<PlaylistMeta | null>(null);

    useEffect(() => {
        if (!playlistId) return;

        setProgress(loadProgress(playlistId));

        fetch("/api/playlist/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                playlistUrl: `https://youtube.com/playlist?list=${playlistId}`,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                setSummary(data.summary);
                setVideos(data.videos);
                setPlaylist(data.playlist);
            })
            .catch(() => setError("Failed to load playlist"))
            .finally(() => setLoading(false));
    }, [playlistId]);

    function toggleWatched(videoId: string) {
        setProgress((prev) => {
            const updated = {
                ...prev,
                [videoId]: { watched: !prev[videoId]?.watched },
            };
            saveProgress(playlistId, updated);
            return updated;
        });
    }

    if (loading) return <p className="p-8">Loading…</p>;
    if (error) return <p className="p-8 text-red-500">{error}</p>;
    if (!summary) return null;

    const watchedCount = videos.filter(
        (v) => progress[v.videoId]?.watched
    ).length;

    const totalDurationSeconds = videos.reduce(
        (a, v) => a + v.durationSeconds,
        0
    );

    const watchedDuration = videos
        .filter((v) => progress[v.videoId]?.watched)
        .reduce((a, v) => a + v.durationSeconds, 0);

    const remainingDuration = formatDuration(
        Math.max(totalDurationSeconds - watchedDuration, 0)
    );

    return (
        <div className="flex gap-8 p-8">
            {/* Left panel */}
            <div className="w-1/2">
                {/* <h2 className="font-semibold text-lg">Playlist</h2>
                <p>{summary.totalVideos} videos</p> */}
                <PlaylistVideoList
                    videos={videos}
                    progress={progress}
                    onToggle={toggleWatched}
                    playlist={playlist}
                />
            </div>

            {/* Right panel */}
            <div className="w-1/2">
                <PlaylistOverview
                    totalVideos={summary.totalVideos}
                    watchedVideos={watchedCount}
                    totalDuration={summary.totalDuration}
                    remainingDuration={remainingDuration}
                />
            </div>
        </div>
    );
}
