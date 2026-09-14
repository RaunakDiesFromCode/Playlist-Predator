"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    PlaylistAnalysis,
    PlaylistMeta,
    VideoMetadata,
} from "@/types/playlist";
import PlaylistOverview from "@/components/playlist/PlaylistOverview";
import PlaylistVideoList from "@/components/playlist/PlaylistVideoList";
import Player from "@/components/playlist/Player";
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
import {
    LogIn,
    NotebookPen,
    Sparkles,
    StickyNote,
    ScanSearch,
    Users,
} from "lucide-react";
import PredAI from "@/components/predai/predai";
import PlaylistFriendsTab from "@/components/playlist/PlaylistFriendsTab";
import { LobbyInfo } from "@/types/friends";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
    const [lobby, setLobby] = useState<LobbyInfo | null>(null);

    const [celebrate, setCelebrate] = useState(false);
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const savedRef = useRef(false);
    const hasResolvedPlaylistRef = useRef(false);
    const celebrationTimerRef = useRef<number | null>(null);
    const refreshLobbyTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleLobbyChange = useCallback((next: LobbyInfo | null) => {
        if (next) setLobby(next);
    }, []);

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
    /* Fetch Crew Lobby + Completions */
    /* ---------------------------------- */

    useEffect(() => {
        if (authLoading || !user) return;

        let cancelled = false;
        fetch(
            `/api/friends/lobby?playlistId=${encodeURIComponent(
                playlistId,
            )}&totalVideos=${summary?.totalVideos ?? 0}&t=${Date.now()}`,
        )
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled && data?.lobby) {
                    setLobby(data.lobby);
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [authLoading, user, playlistId, summary?.totalVideos]);

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

    function changeStatus(videoId: string, status: VideoStatus) {
        const previousStatus = progress[videoId]?.status ?? "NONE";
        if (previousStatus === status) return;

        // 1. UPDATE UI FIRST
        const nextProgress = { ...progress };
        if (status === "NONE") {
            delete nextProgress[videoId];
        } else {
            nextProgress[videoId] = {
                status,
                updatedAt: new Date().toISOString(),
            };
        }
        setProgress(nextProgress);

        let doneDelta = 0;
        if (previousStatus !== "DONE" && status === "DONE") doneDelta = 1;
        else if (previousStatus === "DONE" && status !== "DONE") doneDelta = -1;

        let rewatchDelta = 0;
        if (previousStatus !== "REWATCH" && status === "REWATCH") rewatchDelta = 1;
        else if (previousStatus === "REWATCH" && status !== "REWATCH") rewatchDelta = -1;

        let skippedDelta = 0;
        if (previousStatus !== "SKIP" && status === "SKIP") skippedDelta = 1;
        else if (previousStatus === "SKIP" && status !== "SKIP") skippedDelta = -1;

        if (user) {
            setLobby((prev) => {
                if (!prev) return prev;

                const currentList = prev.videoCompletions?.[videoId] ?? [];
                const withoutUser = currentList.filter(
                    (m) => m.userId !== user.id,
                );

                const myName =
                    user.name || user.email?.split("@")[0] || "You";
                const myAvatar = user.avatarUrl ?? null;
                const isOwner = prev.isOwner;

                let nextVideoCompletions = prev.videoCompletions ?? {};
                if (status === "DONE") {
                    nextVideoCompletions = {
                        ...nextVideoCompletions,
                        [videoId]: [
                            ...withoutUser,
                            {
                                userId: user.id,
                                name: myName,
                                avatarUrl: myAvatar,
                                role: isOwner ? "owner" : "member",
                                completedAt: new Date().toISOString(),
                            },
                        ],
                    };
                } else {
                    nextVideoCompletions = {
                        ...nextVideoCompletions,
                        [videoId]: withoutUser,
                    };
                }

                const safeTotal = summary?.totalVideos || 1;
                const hasUserInMembers = prev.members.some(
                    (m) => m.userId === user.id,
                );

                let nextMembers = prev.members.map((m) => {
                    if (m.userId !== user.id) return m;
                    const newDone = Math.max(0, m.doneCount + doneDelta);
                    const newRewatch = Math.max(0, m.rewatchCount + rewatchDelta);
                    const newSkipped = Math.max(0, m.skippedCount + skippedDelta);
                    const totalVids = safeTotal > 0 ? safeTotal : (m.totalVideos || 1);
                    const newPercentage = Math.min(
                        100,
                        Math.round((newDone / totalVids) * 100),
                    );
                    return {
                        ...m,
                        avatarUrl: m.avatarUrl || myAvatar,
                        doneCount: newDone,
                        rewatchCount: newRewatch,
                        skippedCount: newSkipped,
                        totalVideos: totalVids,
                        completionPercentage: newPercentage,
                        lastActiveAt: new Date().toISOString(),
                    };
                });

                if (!hasUserInMembers) {
                    const newDone = Math.max(0, doneDelta);
                    const newRewatch = Math.max(0, rewatchDelta);
                    const newSkipped = Math.max(0, skippedDelta);
                    const newPercentage = Math.min(
                        100,
                        Math.round((newDone / safeTotal) * 100),
                    );
                    nextMembers = [
                        ...nextMembers,
                        {
                            userId: user.id,
                            name: myName,
                            avatarUrl: myAvatar,
                            role: isOwner ? "owner" : "member",
                            joinedAt: new Date().toISOString(),
                            doneCount: newDone,
                            rewatchCount: newRewatch,
                            skippedCount: newSkipped,
                            totalVideos: safeTotal,
                            completionPercentage: newPercentage,
                            lastActiveAt: new Date().toISOString(),
                        },
                    ];
                }

                return {
                    ...prev,
                    videoCompletions: nextVideoCompletions,
                    members: nextMembers,
                };
            });
        }

        // 2. BACKEND IN THE BACKGROUND
        void updateVideoStatus(playlistId, progress, videoId, status)
            .then(() => {
                // Debounce background refresh lobby to prevent request bursts
                if (refreshLobbyTimerRef.current) {
                    clearTimeout(refreshLobbyTimerRef.current);
                }
                refreshLobbyTimerRef.current = setTimeout(async () => {
                    try {
                        const res = await fetch(
                            `/api/friends/lobby?playlistId=${encodeURIComponent(
                                playlistId,
                            )}&totalVideos=${summary?.totalVideos ?? 0}&t=${Date.now()}`,
                        );
                        if (res.ok) {
                            const data = await res.json();
                            if (data?.lobby) {
                                setLobby(data.lobby);
                            }
                        }
                    } catch {
                        // Silent background sync
                    }
                }, 1500);
            })
            .catch(() => {});
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

    const searchParams = useSearchParams();

    const [activeTab, setActiveTab] = useState<
        "overview" | "PredAI" | "Notes" | "Crew"
    >("overview");

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (
            tab === "Crew" ||
            tab === "crew" ||
            tab === "Friends" ||
            tab === "friends"
        ) {
            setActiveTab("Crew");
        }
    }, [searchParams]);

    const [activeVideo, setActiveVideo] = useState<VideoMetadata | null>(null);

    const handleVideoClick = useCallback((video: VideoMetadata) => {
        if (isMobile) {
            const url = video.watchUrl ?? `https://www.youtube.com/watch?v=${video.videoId}`;
            window.open(url, "_blank", "noopener,noreferrer");
            return;
        }

        setActiveVideo(video);
    }, [isMobile]);

    const handleClosePlayer = useCallback(() => {
        setActiveVideo(null);
    }, []);

    if (loading) return <PlaylistPageSkeleton />;
    if (error) return <p className="p-8 text-red-500">{error}</p>;
    if (!summary || !playlist) return null;

    const RightPannel = (
        <div className="rounded-none border border-border h-full flex flex-col">
            {/* Tab bar */}
            <div className="w-full sticky top-0 z-10 bg-background inline-flex items-center rounded-none border-b border-border">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-none px-3 py-1 text-sm font-medium transition-colors ${
                        activeTab === "overview"
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <span className="flex items-center gap-1">
                        Overview <ScanSearch size={16} />
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("PredAI")}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-none px-3 py-1 text-sm font-medium transition-colors ${
                        activeTab === "PredAI"
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <span className="flex items-center gap-1">
                        PredAI <Sparkles size={16} />
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("Notes")}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-none px-3 py-1 text-sm font-medium transition-colors ${
                        activeTab === "Notes"
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <span className="flex items-center gap-1">
                        Notes <NotebookPen size={16} />
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("Crew")}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-none px-3 py-1 text-sm font-medium transition-colors ${
                        activeTab === "Crew"
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <span className="flex items-center gap-1">
                        Crew <Users size={16} />
                    </span>
                </button>
            </div>

            {/* Panels stay mounted; hide inactive with display:none */}
            <div
                style={{ display: activeTab === "overview" ? "flex" : "none" }}
                className="flex-1 flex-col overflow-y-auto"
            >
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
            </div>

            <div
                style={{ display: activeTab === "PredAI" ? "flex" : "none" }}
                className="h-full flex-1 flex-col overflow-hidden"
            >
                {user ? (
                    <PredAI
                        playlistId={playlistId}
                        initialData={initialData}
                        initialProgress={initialProgress}
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                        <LogIn className="h-10 w-10 text-muted-foreground" />

                        <h2 className="text-lg font-semibold">
                            Sign in to use PredAI
                        </h2>

                        <p className="max-w-xs text-sm text-muted-foreground">
                            PredAI is available exclusively to signed-in users.
                            Please sign in to access your personalized study
                            assistant.
                        </p>

                        <Link
                            href="/login"
                            className="mt-2 inline-flex items-center gap-2 rounded-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            <LogIn className="h-4 w-4" />
                            Sign In
                        </Link>
                    </div>
                )}
            </div>

            <div
                style={{ display: activeTab === "Notes" ? "flex" : "none" }}
                className="h-full flex-1 flex-col overflow-hidden"
            >
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-none border border-border bg-muted">
                        <StickyNote className="h-8 w-8 text-muted-foreground" />
                    </div>

                    <h2 className="text-xl font-bold">Notes</h2>

                    <p className="max-w-xs text-sm text-muted-foreground">
                        Jot down thoughts, summaries, and key takeaways for each
                        video. Your notes will sync across devices.
                    </p>

                    <div className="mt-2 inline-flex items-center gap-2 rounded-none border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Coming Soon
                    </div>
                </div>
            </div>

            <div
                style={{ display: activeTab === "Crew" ? "flex" : "none" }}
                className="h-full flex-1 flex-col overflow-hidden"
            >
                <PlaylistFriendsTab
                    playlistId={playlistId}
                    totalVideos={summary?.totalVideos ?? 0}
                    isActive={activeTab === "Crew"}
                    lobby={lobby}
                    onLobbyChange={handleLobbyChange}
                />
            </div>
        </div>
    );

    /* ---------------------------------- */
    /* Desktop */
    /* ---------------------------------- */

    if (!isMobile) {
        return (
            <div>
                <Player video={activeVideo} videos={videos} onClose={handleClosePlayer} onNavigate={setActiveVideo} />

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
                            onVideoClick={handleVideoClick}
                            playlist={playlist}
                            videoCompletions={lobby?.videoCompletions}
                            currentUserId={user?.id}
                            isMobile={false}
                        />
                    </div>

                    <div className="w-1/2 h-[calc(100dvh-4.3em)] overflow-y-auto">
                        {RightPannel}
                    </div>
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
                    onVideoClick={handleVideoClick}
                    playlist={playlist}
                    videoCompletions={lobby?.videoCompletions}
                    currentUserId={user?.id}
                    isMobile={true}
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
