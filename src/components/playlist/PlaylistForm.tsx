"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PlaylistAnalysis, VideoMetadata } from "@/types/playlist";
import PlaylistOverview from "./PlaylistOverview";
import PlaylistVideoList from "./PlaylistVideoList";

const PlaylistForm = () => {
    const [playlistUrl, setPlaylistUrl] = useState("");
    const [completedVideos, setCompletedVideos] = useState(0);

    const [summary, setSummary] = useState<PlaylistAnalysis | null>(null);
    const [videos, setVideos] = useState<VideoMetadata[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!playlistUrl.trim()) {
            setError("Please enter a playlist URL.");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/playlist/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playlistUrl, completedVideos }),
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

                <input
                    type="number"
                    min={0}
                    value={completedVideos}
                    onChange={(e) =>
                        setCompletedVideos(Number(e.target.value) || 0)
                    }
                    placeholder="Videos completed"
                    className="w-full p-3 rounded-lg border dark:border-gray-700 dark:bg-gray-800"
                />

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
                    <PlaylistOverview summary={summary} />
                    <PlaylistVideoList videos={videos} />
                </div>
            )}
        </div>
    );
};

export default PlaylistForm;
