"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { PlaylistAnalysis, VideoMetadata } from "@/types/playlist";
import PlaylistOverview from "./PlaylistOverview";
import PlaylistVideoList from "./PlaylistVideoList";
import PlaylistAnalysisSkeleton from "./PlaylistAnalysisSkeleton";
import { loadProgress } from "@/lib/storage/progress";
import { updateVideoStatus } from "@/lib/progress";
import { PlaylistProgress, VideoStatus } from "@/types/progress";
import { formatDuration } from "@/lib/time/duration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseYouTubeInput } from "@/lib/youtube/input";
import StudyPlanner from "@/components/study-planner";
import { useStudyPlannerPreferences } from "@/hooks/use-study-planner-preferences";

// import { formatDuration } from "@/lib/time/duration";

const PlaylistForm = () => {
    const [playlistUrl, setPlaylistUrl] = useState("");

    const [summary, setSummary] = useState<PlaylistAnalysis | null>(null);
    const [videos, setVideos] = useState<VideoMetadata[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [progress, setProgress] = useState<PlaylistProgress>({});

    const [playlistId, setPlaylistId] = useState<string | null>(null);
    const plannerStorageKey = `study-planner:${playlistId ?? "global"}`;
    const { preferences, setStudyTime, setPreferredSpeed } =
        useStudyPlannerPreferences(plannerStorageKey);

    const doneCount = videos.filter(
        (v) => progress[v.videoId]?.status === "DONE",
    ).length;

    const rewatchCount = videos.filter(
        (v) => progress[v.videoId]?.status === "REWATCH",
    ).length;

    const watchedDuration = videos
        .filter(
            (v) =>
                progress[v.videoId]?.status === "DONE" ||
                progress[v.videoId]?.status === "REWATCH",
        )
        .reduce((acc, v) => acc + v.durationSeconds, 0);

    const totalDurationSeconds = videos.reduce(
        (acc, v) => acc + v.durationSeconds,
        0,
    );

    const skippedCount = videos.filter(
        (v) => progress[v.videoId]?.status === "SKIP",
    ).length;

    const remainingDurationSeconds = Math.max(
        totalDurationSeconds - watchedDuration,
        0,
    );

    const remainingVideos = Math.max(
        videos.length - doneCount - rewatchCount - skippedCount,
        0,
    );

    const remainingDurationFormatted = formatDuration(
        Math.max(totalDurationSeconds - watchedDuration, 0),
    );

    useEffect(() => {
        if (!playlistId) return;
        setProgress(loadProgress(playlistId));
    }, [playlistId]);

    function handleStatusChange(videoId: string, status: VideoStatus) {
        if (!playlistId) return;

        void updateVideoStatus(playlistId, progress, videoId, status).then(
            setProgress,
        );
    }

    function extractPlaylistId(url: string): string | null {
        return parseYouTubeInput(url)?.id ?? null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!playlistUrl.trim()) {
            setError("Please enter a playlist or video URL.");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const id = extractPlaylistId(playlistUrl);
            if (!id) {
                setError("Invalid playlist or video URL");
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
                <Label htmlFor="playlist-url" className="sr-only">
                    YouTube playlist or video URL
                </Label>
                <Input
                    id="playlist-url"
                    type="text"
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    placeholder="YouTube playlist or video URL"
                    className="w-full"
                />

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full gap-2"
                >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    Analyze Playlist
                </Button>
            </form>

            {error && <p className="mt-4 text-center text-red-500">{error}</p>}

            {loading ? (
                <PlaylistAnalysisSkeleton />
            ) : summary ? (
                <div className="mt-8 space-y-8">
                    <PlaylistOverview
                        videos={videos}
                        totalVideos={summary.totalVideos}
                        doneVideos={doneCount}
                        rewatchVideos={rewatchCount}
                        skippedVideos={skippedCount}
                        totalDuration={summary.totalDuration}
                        remainingDuration={remainingDurationFormatted}
                        progress={progress}
                        preferredSpeed={preferences.preferredSpeed}
                        onPreferredSpeedChange={setPreferredSpeed}
                    />

                    <StudyPlanner
                        remainingMinutes={remainingDurationSeconds / 60}
                        remainingVideos={remainingVideos}
                        studyHours={preferences.hours}
                        studyMinutes={preferences.minutes}
                        preferredSpeed={preferences.preferredSpeed}
                        onStudyTimeChange={setStudyTime}
                    />

                    <PlaylistVideoList
                        videos={videos}
                        progress={progress}
                        onStatusChange={handleStatusChange}
                        playlist={null}
                    />
                </div>
            ) : null}
        </div>
    );
};

export default PlaylistForm;
