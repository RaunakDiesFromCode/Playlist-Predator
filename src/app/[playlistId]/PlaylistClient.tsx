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
import { loadProgress, updateVideoStatus } from "@/lib/progress";
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

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

const EMPTY_VIDEOS: VideoMetadata[] = [];
const THEME_TRANSITION_CLASS = "theme-transitioning";
const THEME_TRANSITION_MS = 700;

type PlaylistClientProps = {
    playlistId: string;
    initialData: {
        summary: PlaylistAnalysis;
        videos: VideoMetadata[];
        playlist: PlaylistMeta;
    } | null;
    initialError: string | null;
    initialProgress: PlaylistProgress;
};

type HslTuple = [number, number, number];

type PaletteSwatch = {
    hsl: HslTuple;
    titleTextColor: string;
    bodyTextColor: string;
};

type VibrantPalette = {
    Vibrant: PaletteSwatch | null;
    Muted: PaletteSwatch | null;
    DarkVibrant: PaletteSwatch | null;
    DarkMuted: PaletteSwatch | null;
    LightVibrant: PaletteSwatch | null;
    LightMuted: PaletteSwatch | null;
};

const THEME_VARS = [
    "--background",
    "--card",
    "--popover",
    "--primary",
    "--primary-foreground",
    "--secondary",
    "--secondary-foreground",
    "--muted",
    "--muted-foreground",
    "--accent",
    "--accent-foreground",
    "--border",
    "--input",
    "--ring",
    "--chart-1",
    "--chart-2",
    "--chart-3",
    "--chart-4",
    "--chart-5",
    "--sidebar-background",
    "--sidebar-foreground",
    "--sidebar-primary",
    "--sidebar-primary-foreground",
    "--sidebar-accent",
    "--sidebar-accent-foreground",
    "--sidebar-border",
    "--sidebar-ring",
] as const;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function pickSwatch(...swatches: Array<PaletteSwatch | null | undefined>) {
    return swatches.find(Boolean) ?? null;
}

function formatHsl([h, s, l]: HslTuple) {
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function textColorToHsl(value?: string | null) {
    return value === "#000" ? "0 0% 9%" : "0 0% 98%";
}

function adjustHsl(
    swatch: PaletteSwatch | null,
    options: {
        hueShift?: number;
        saturationTarget?: number;
        saturationScale?: number;
        saturationOffset?: number;
        lightnessTarget?: number;
        lightnessScale?: number;
        lightnessOffset?: number;
    } = {},
) {
    const [h, s, l] = swatch?.hsl ?? [0, 0, 0];

    const nextH = (((h + (options.hueShift ?? 0) / 360) % 1) + 1) % 1;
    const nextS =
        options.saturationTarget ??
        clamp(
            s * (options.saturationScale ?? 1) +
                (options.saturationOffset ?? 0),
            0,
            1,
        );
    const nextL =
        options.lightnessTarget ??
        clamp(
            l * (options.lightnessScale ?? 1) + (options.lightnessOffset ?? 0),
            0,
            1,
        );

    return [nextH, nextS, nextL] as HslTuple;
}

function buildThemeVars(palette: VibrantPalette, isDarkMode: boolean) {
    const primary = pickSwatch(
        palette.Vibrant,
        palette.Muted,
        palette.DarkVibrant,
        palette.LightVibrant,
        palette.DarkMuted,
        palette.LightMuted,
    );

    const surface = pickSwatch(
        isDarkMode ? palette.DarkMuted : palette.LightMuted,
        palette.Muted,
        primary,
    );

    const elevated = pickSwatch(
        isDarkMode ? palette.DarkVibrant : palette.LightVibrant,
        primary,
        surface,
    );

    const accent = adjustHsl(primary, {
        saturationScale: 1.05,
        lightnessScale: isDarkMode ? 0.98 : 1.02,
    });

    const mutedSurface = adjustHsl(surface, {
        saturationTarget: isDarkMode ? 0.22 : 0.16,
        lightnessTarget: isDarkMode ? 0.13 : 0.965,
    });

    const cardSurface = adjustHsl(elevated, {
        saturationTarget: isDarkMode ? 0.2 : 0.14,
        lightnessTarget: isDarkMode ? 0.16 : 0.99,
    });

    const borderSurface = adjustHsl(surface, {
        saturationTarget: isDarkMode ? 0.18 : 0.12,
        lightnessTarget: isDarkMode ? 0.22 : 0.88,
    });

    const chartBase = primary ?? surface;

    return {
        "--background": formatHsl(mutedSurface),
        "--card": formatHsl(cardSurface),
        "--popover": formatHsl(cardSurface),
        "--primary": formatHsl(accent),
        "--primary-foreground": textColorToHsl(primary?.titleTextColor),
        "--secondary": formatHsl(mutedSurface),
        "--secondary-foreground": textColorToHsl(primary?.bodyTextColor),
        "--muted": formatHsl(mutedSurface),
        "--muted-foreground": isDarkMode ? "0 0% 68%" : "0 0% 38%",
        "--accent": formatHsl(mutedSurface),
        "--accent-foreground": textColorToHsl(primary?.bodyTextColor),
        "--border": formatHsl(borderSurface),
        "--input": formatHsl(borderSurface),
        "--ring": formatHsl(accent),
        "--chart-1": formatHsl(accent),
        "--chart-2": formatHsl(adjustHsl(chartBase, { hueShift: 32 })),
        "--chart-3": formatHsl(adjustHsl(chartBase, { hueShift: -28 })),
        "--chart-4": formatHsl(adjustHsl(chartBase, { hueShift: 140 })),
        "--chart-5": formatHsl(adjustHsl(chartBase, { hueShift: -140 })),
        "--sidebar-background": formatHsl(mutedSurface),
        "--sidebar-foreground": isDarkMode ? "0 0% 96%" : "0 0% 14%",
        "--sidebar-primary": formatHsl(accent),
        "--sidebar-primary-foreground": textColorToHsl(primary?.titleTextColor),
        "--sidebar-accent": formatHsl(cardSurface),
        "--sidebar-accent-foreground": textColorToHsl(primary?.bodyTextColor),
        "--sidebar-border": formatHsl(borderSurface),
        "--sidebar-ring": formatHsl(accent),
    } as Record<string, string>;
}

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

export default function PlaylistClient({
    playlistId,
    initialData,
    initialError,
    initialProgress,
}: PlaylistClientProps) {
    const { user, loading: authLoading } = useAuth();

    const [progress, setProgress] = useState<PlaylistProgress>(initialProgress);

    const [isMobile, setIsMobile] = useState(false);
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
    const playlistCover = playlist?.thumbnail ?? videos[0]?.thumbnail ?? null;

    useEffect(() => {
        if (!playlistCover) return;

        const root = document.documentElement;
        const previousVars = new Map<string, string | null>();
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        let transitionTimerId: number | null = null;

        for (const name of THEME_VARS) {
            previousVars.set(name, root.style.getPropertyValue(name));
        }

        let cancelled = false;

        async function applyPalette() {
            try {
                const { Vibrant } = await import("node-vibrant/browser");
                const palette = await Vibrant.from(playlistCover).getPalette();
                if (cancelled) return;

                const isDarkMode = root.classList.contains("dark");
                const nextVars = buildThemeVars(palette, isDarkMode);

                if (!prefersReducedMotion) {
                    root.classList.add(THEME_TRANSITION_CLASS);
                    window.requestAnimationFrame(() => {
                        if (cancelled) {
                            root.classList.remove(THEME_TRANSITION_CLASS);
                            return;
                        }

                        for (const [name, value] of Object.entries(nextVars)) {
                            root.style.setProperty(name, value);
                        }

                        transitionTimerId = window.setTimeout(() => {
                            root.classList.remove(THEME_TRANSITION_CLASS);
                            transitionTimerId = null;
                        }, THEME_TRANSITION_MS);
                    });

                    return;
                }

                for (const [name, value] of Object.entries(nextVars)) {
                    root.style.setProperty(name, value);
                }
            } catch (error) {
                console.error("Failed to extract playlist theme", error);
            }
        }

        applyPalette();

        return () => {
            cancelled = true;

            if (transitionTimerId) {
                window.clearTimeout(transitionTimerId);
                transitionTimerId = null;
            }

            root.classList.remove(THEME_TRANSITION_CLASS);

            for (const [name, value] of previousVars.entries()) {
                if (value) {
                    root.style.setProperty(name, value);
                } else {
                    root.style.removeProperty(name);
                }
            }
        };
    }, [playlistCover]);

    useEffect(() => {
        if (playlist?.title) {
            document.title = `${playlist.title} | Playlist Predator`;
        }
    }, [playlist?.title]);

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

    const { doneCount, rewatchCount, skippedCount, remainingDuration } =
        useMemo(() => {
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

            return {
                doneCount: done,
                rewatchCount: rewatch,
                skippedCount: skipped,
                totalDurationSeconds: totalSeconds,
                remainingDuration: formatDuration(
                    Math.max(totalSeconds - watchedSeconds, 0),
                ),
            };
        }, [progress, videos]);

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

    const AnalysisPanel = (
        <PlaylistOverview
            totalVideos={summary.totalVideos}
            doneVideos={doneCount}
            rewatchVideos={rewatchCount}
            skippedVideos={skippedCount}
            totalDuration={summary.totalDuration}
            remainingDuration={remainingDuration}
            progress={progress}
        />
    );

    /* ---------------------------------- */
    /* Desktop */
    /* ---------------------------------- */

    if (!isMobile) {
        return (
            <div
                className="relative flex gap-2 p-2"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at top, hsl(var(--primary) / 0.12), transparent 42%), radial-gradient(circle at bottom right, hsl(var(--accent) / 0.08), transparent 28%)",
                }}
            >
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

                <div className="w-1/2 h-[calc(100dvh-5rem)] overflow-hidden">
                    <PlaylistVideoList
                        videos={videos}
                        progress={progress}
                        onStatusChange={changeStatus}
                        playlist={playlist}
                    />
                </div>

                <div className="w-1/2 h-[calc(100dvh-5em)] overflow-y-auto">
                    {AnalysisPanel}
                </div>
            </div>
        );
    }

    /* ---------------------------------- */
    /* Mobile (Drawer) */
    /* ---------------------------------- */

    return (
        <div
            className="relative flex h-[calc(100dvh-4rem)] flex-col gap-4 md:p-4 p-2 transition-colors"
            style={{
                backgroundImage:
                    "radial-gradient(circle at top, hsl(var(--primary) / 0.12), transparent 42%), radial-gradient(circle at bottom right, hsl(var(--accent) / 0.08), transparent 28%)",
            }}
        >
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

            <div className="flex-1 overflow-hidden ">
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

                    <div className="md:px-4 px-2 pb-6 overflow-y-auto">
                        {AnalysisPanel}
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
