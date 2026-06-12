"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    PlaylistAnalysis,
    PlaylistMeta,
    VideoMetadata,
} from "@/types/playlist";
import PlaylistOverview from "@/components/playlist/PlaylistOverview";
import PlaylistVideoList from "@/components/playlist/PlaylistVideoList";
import StudyPlanner from "@/components/study-planner";
import { loadProgress, updateVideoStatus } from "@/lib/progress";
import { PlaylistProgress, VideoStatus } from "@/types/progress";
import { formatDuration } from "@/lib/time/duration";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { upsertSidebarPlaylist } from "@/lib/sidebar/playlists";
import { useStudyPlannerPreferences } from "@/hooks/use-study-planner-preferences";
import { Separator } from "@/components/ui/separator";

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

const EMPTY_VIDEOS: VideoMetadata[] = [];
type PlaylistClientProps = {
    playlistId: string;
    isMobile: boolean;
    initialData: {
        summary: PlaylistAnalysis;
        videos: VideoMetadata[];
        playlist: PlaylistMeta;
    } | null;
    initialError: string | null;
    initialProgress: PlaylistProgress;
};

/* ---------------------------------- */
/* Skeleton */
/* ---------------------------------- */

function PlaylistPageSkeleton() {
    return (
        <div className="flex gap-4 p-4">
            <div className="w-full h-[calc(100dvh-6rem)] overflow-hidden space-y-4">
                <Skeleton className="h-64 w-full rounded-none" />
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="h-20 w-32 rounded-none" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-full h-[calc(100dvh-6rem)] md:block hidden overflow-y-auto space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-24 w-full rounded-none" />
                <Skeleton className="h-24 w-full rounded-none" />
                <Skeleton className="h-24 w-full rounded-none" />
            </div>
        </div>
    );
}

/* ---------------------------------- */
/* Main Component */
/* ---------------------------------- */

export default function PlaylistClient({
    playlistId,
    isMobile,
    initialData,
    initialError,
    initialProgress,
}: PlaylistClientProps) {
    const { user, loading: authLoading } = useAuth();

    const [progress, setProgress] = useState<PlaylistProgress>(initialProgress);

    const [celebrate, setCelebrate] = useState(false);
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const savedRef = useRef(false);
    const hasResolvedPlaylistRef = useRef(false);
    const celebrationTimerRef = useRef<number | null>(null);
    const summary = initialData?.summary ?? null;
    const videos = initialData?.videos ?? EMPTY_VIDEOS;
    const playlist = initialData?.playlist ?? null;
    const loading = !initialData && !initialError;
    const error = initialError;
    const plannerStorageKey = `study-planner:${playlistId}`;
    const { preferences, setStudyTime, setPreferredSpeed } =
        useStudyPlannerPreferences(plannerStorageKey);

    useEffect(() => {
        if (playlist?.title) {
            document.title = `${playlist.title} | Playlist Predator`;
        }
    }, [playlist?.title]);

    useEffect(() => {
        const updateViewport = () => {
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        updateViewport();
        window.addEventListener("resize", updateViewport);

        return () => window.removeEventListener("resize", updateViewport);
    }, []);

    /* ---------------------------------- */
    /* Fetch playlist + progress */
    /* ---------------------------------- */

    useEffect(() => {
        void loadProgress(playlistId)
            .then(setProgress)
            .catch(() => undefined);
    }, [playlistId]);

    /* ---------------------------------- */
    /* Save playlist once */
    /* ---------------------------------- */

    useEffect(() => {
        if (authLoading || !user || !playlist || savedRef.current) return;

        savedRef.current = true;

        const timestamp = new Date().toISOString();
        upsertSidebarPlaylist(user.id, {
            id: playlistId,
            user_id: user.id,
            youtube_playlist_id: playlistId,
            title: playlist.title,
            thumbnail: playlist.thumbnail ?? null,
            created_at: timestamp,
            updated_at: timestamp,
        });

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
        const next = await updateVideoStatus(
            playlistId,
            progress,
            videoId,
            status,
        );
        setProgress(next);
    }

    /* ---------------------------------- */
    /* Completion + stats */
    /* ---------------------------------- */

    const {
        doneCount,
        rewatchCount,
        skippedCount,
        remainingDuration,
        remainingDurationSeconds,
    } = useMemo(() => {
        let done = 0;
        let rewatch = 0;
        let skipped = 0;
        let totalSeconds = 0;
        let watchedSeconds = 0;

        for (const video of videos) {
            totalSeconds += video.durationSeconds;

            const status = progress[video.videoId]?.status;

            if (status === "DONE") {
                done += 1;
                watchedSeconds += video.durationSeconds;
                continue;
            }

            if (status === "REWATCH") {
                rewatch += 1;
                watchedSeconds += video.durationSeconds;
                continue;
            }

            if (status === "SKIP") {
                skipped += 1;
            }
        }

        const nextRemainingSeconds = Math.max(totalSeconds - watchedSeconds, 0);

        return {
            doneCount: done,
            rewatchCount: rewatch,
            skippedCount: skipped,
            totalDurationSeconds: totalSeconds,
            remainingDurationSeconds: nextRemainingSeconds,
            remainingDuration: formatDuration(nextRemainingSeconds),
        };
    }, [progress, videos]);

    const remainingVideos = Math.max(
        videos.length - doneCount - rewatchCount - skippedCount,
        0,
    );

    const isComplete = videos.length > 0 && doneCount === videos.length;

    useEffect(() => {
        if (loading || !summary || !playlist) {
            return;
        }

        if (!hasResolvedPlaylistRef.current) {
            hasResolvedPlaylistRef.current = true;
            return;
        }

        if (!isComplete) {
            return;
        }

        setCelebrate(true);

        if (celebrationTimerRef.current) {
            window.clearTimeout(celebrationTimerRef.current);
        }

        celebrationTimerRef.current = window.setTimeout(() => {
            setCelebrate(false);
            celebrationTimerRef.current = null;
        }, 5000);

        return () => {
            if (celebrationTimerRef.current) {
                window.clearTimeout(celebrationTimerRef.current);
            }
        };
    }, [isComplete, loading, playlist, summary]);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setPrefersReducedMotion(mq.matches);

        update();
        mq.addEventListener("change", update);

        return () => mq.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        if (!celebrate || prefersReducedMotion || !isComplete) {
            return;
        }

        const updateViewport = () => {
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        updateViewport();
        window.addEventListener("resize", updateViewport);

        return () => window.removeEventListener("resize", updateViewport);
    }, [celebrate, prefersReducedMotion, isComplete]);

    const showConfetti =
        celebrate &&
        !prefersReducedMotion &&
        isComplete &&
        viewport.width > 0 &&
        viewport.height > 0;

    /* ---------------------------------- */
    /* States */
    /* ---------------------------------- */

    if (loading) return <PlaylistPageSkeleton />;
    if (error) return <p className="p-8 text-red-500">{error}</p>;
    if (!summary || !playlist) return null;

    const RightPannel = (
        <Tabs
            defaultValue="overview"
            className="rounded-none border border-border h-full overflow-y-auto"
        >
            <TabsList className="w-full sticky top-0 z-10 bg-background">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger
                    value="PredAI"
                    className="data-[state=active]:bg-yellow-500 flex gap-1"
                >
                    PredAI <Sparkles size={16} />
                </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="">
                <div className="flex flex-col gap-2">
                    <PlaylistOverview
                        playlist={playlist}
                        videos={videos}
                        totalVideos={summary.totalVideos}
                        doneVideos={doneCount}
                        rewatchVideos={rewatchCount}
                        skippedVideos={skippedCount}
                        totalDuration={summary.totalDuration}
                        remainingDuration={remainingDuration}
                        progress={progress}
                        preferredSpeed={preferences.preferredSpeed}
                        onPreferredSpeedChange={setPreferredSpeed}
                    />

                    <Separator />

                    <StudyPlanner
                        remainingMinutes={remainingDurationSeconds / 60}
                        remainingVideos={remainingVideos}
                        studyHours={preferences.hours}
                        studyMinutes={preferences.minutes}
                        preferredSpeed={preferences.preferredSpeed}
                        onStudyTimeChange={setStudyTime}
                    />
                </div>
            </TabsContent>
            <TabsContent value="PredAI" className="h-full">
                <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="text-3xl font-bold uppercase">
                        Coming Soon!
                    </div>
                    <div className="mt-2 max-w-md text-lg text-muted-foreground border border-border p-3">
                        Personalized study powered by PredAI, tailored to
                        your progress and preferences!
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );

    /* ---------------------------------- */
    /* Desktop */
    /* ---------------------------------- */

    if (!isMobile) {
        return (
            <div className="relative flex gap-2 p-2">
                {showConfetti ? (
                    <Confetti
                        width={viewport.width}
                        height={viewport.height}
                        recycle={false}
                        numberOfPieces={220}
                        gravity={0.18}
                        className="pointer-events-none fixed inset-0 z-50"
                    />
                ) : null}

                <div className="w-1/2 h-[calc(100dvh-4.3em)] overflow-hidden">
                    <PlaylistVideoList
                        videos={videos}
                        progress={progress}
                        onStatusChange={changeStatus}
                        playlist={playlist}
                        playlistId={playlistId}
                    />
                </div>

                <div className="w-1/2 h-[calc(100dvh-4.3em)] overflow-y-auto">
                    {RightPannel}
                </div>
            </div>
        );
    }

    /* ---------------------------------- */
    /* Mobile (Drawer) */
    /* ---------------------------------- */

    return (
        <div className="relative flex h-[calc(100dvh-4rem)] flex-col gap-4 p-2 transition-colors md:p-4">
            {showConfetti ? (
                <Confetti
                    width={viewport.width}
                    height={viewport.height}
                    recycle={false}
                    numberOfPieces={220}
                    gravity={0.18}
                    className="pointer-events-none fixed inset-0 z-[100]"
                />
            ) : null}

            <div className="flex-1 overflow-hidden ">
                <PlaylistVideoList
                    videos={videos}
                    progress={progress}
                    onStatusChange={changeStatus}
                    playlist={playlist}
                />
            </div>

            <Drawer>
                <DrawerTrigger className="w-full rounded-none bg-primary text-primary-foreground py-3 font-medium">
                    View Playlist Analysis
                </DrawerTrigger>

                <DrawerContent className="max-h-[85dvh]">
                    <DrawerHeader>
                        <DrawerTitle>Playlist Analysis</DrawerTitle>
                    </DrawerHeader>

                    <div className="md:px-4 px-2 pb-6 overflow-y-auto">
                        {RightPannel}
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
