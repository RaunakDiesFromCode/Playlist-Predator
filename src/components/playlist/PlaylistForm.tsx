"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { PlaylistAnalysis, VideoMetadata } from "@/types/playlist";
import PlaylistOverview from "./PlaylistOverview";
import PlaylistVideoList from "./PlaylistVideoList";
import { loadProgress, saveProgress } from "@/lib/storage/progress";
import { PlaylistProgress } from "@/types/progress";
import { formatDuration } from "@/lib/time/duration";
// import { formatDuration } from "@/lib/time/duration";

const PlaylistForm = () => {
    const [playlistUrl, setPlaylistUrl] = useState("");

    const [summary, setSummary] = useState<PlaylistAnalysis | null>(null);
    const [videos, setVideos] = useState<VideoMetadata[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [progress, setProgress] = useState<PlaylistProgress>({});

    const [playlistId, setPlaylistId] = useState<string | null>(null);

    const watchedCount = videos.filter(
        (v) => progress[v.videoId]?.watched
    ).length;

    const watchedDuration = videos
        .filter((v) => progress[v.videoId]?.watched)
        .reduce((acc, v) => acc + v.durationSeconds, 0);

    const totalDurationSeconds = videos.reduce(
        (acc, v) => acc + v.durationSeconds,
        0
    );

    const remainingDurationFormatted = formatDuration(
        Math.max(totalDurationSeconds - watchedDuration, 0)
    );

    useEffect(() => {
        if (!playlistId) return;
        setProgress(loadProgress(playlistId));
    }, [playlistId]);


    function toggleWatched(videoId: string) {
        if (!playlistId) return;

        setProgress((prev) => {
            const updated = {
                ...prev,
                [videoId]: { watched: !prev[videoId]?.watched },
            };
            saveProgress(playlistId, updated);
            return updated;
        });
    }

    function extractPlaylistId(url: string): string | null {
        try {
            return new URL(url).searchParams.get("list");
        } catch {
            return null;
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!playlistUrl.trim()) {
            setError("Please enter a playlist URL.");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const id = extractPlaylistId(playlistUrl);
            if (!id) {
                setError("Invalid playlist URL");
                setLoading(false);
                return;
            }

            setPlaylistId(id);
            const res = await fetch("/api/playlist/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playlistUrl }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to analyze playlist");
                return;
            }

            setSummary(data.summary);
            setVideos(data.videos);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    placeholder="YouTube playlist URL"
                    className="w-full p-3 rounded-lg border dark:border-gray-700 dark:bg-gray-800"
                />

                {/* <input
                    type="number"
                    min={0}
                    value={completedVideos}
                    onChange={(e) =>
                        setCompletedVideos(Number(e.target.value) || 0)
                    }
                    placeholder="Videos completed"
                    className="w-full p-3 rounded-lg border dark:border-gray-700 dark:bg-gray-800"
                /> */}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    Analyze Playlist
                </button>
            </form>

            {error && <p className="mt-4 text-center text-red-500">{error}</p>}

            {summary && (
                <div className="mt-8 space-y-8">
                    <PlaylistOverview
                        totalVideos={summary.totalVideos}
                        watchedVideos={watchedCount}
                        totalDuration={summary.totalDuration}
                        remainingDuration={remainingDurationFormatted}
                    />

                    <PlaylistVideoList
                        videos={videos}
                        progress={progress}
                        onToggle={toggleWatched}
                    />
                </div>
            )}
        </div>
    );
};

export default PlaylistForm;
