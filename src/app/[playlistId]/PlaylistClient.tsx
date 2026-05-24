"use client";

import { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import { Vibrant } from "node-vibrant/browser";
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

export default function PlaylistClient({ playlistId }: { playlistId: string }) {
    const { user, loading: authLoading } = useAuth();

    const [summary, setSummary] = useState<PlaylistAnalysis | null>(null);
    const [videos, setVideos] = useState<VideoMetadata[]>([]);
    const [progress, setProgress] = useState<PlaylistProgress>({});
    const [playlist, setPlaylist] = useState<PlaylistMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isMobile, setIsMobile] = useState(false);
    const [celebrate, setCelebrate] = useState(false);
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const savedRef = useRef(false);
    const hasResolvedPlaylistRef = useRef(false);
    const celebrationTimerRef = useRef<number | null>(null);
    const playlistCover = playlist?.thumbnail ?? videos[0]?.thumbnail ?? null;

    useEffect(() => {
        if (!playlistCover) return;

        const root = document.documentElement;
        const previousVars = new Map<string, string | null>();

        for (const name of THEME_VARS) {
            previousVars.set(name, root.style.getPropertyValue(name));
        }

        let cancelled = false;

        async function applyPalette() {
            try {
                const palette = await Vibrant.from(playlistCover).getPalette();
                if (cancelled) return;

                const isDarkMode = root.classList.contains("dark");
                const nextVars = buildThemeVars(palette, isDarkMode);

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

    const doneCount = videos.filter(
        (v) => progress[v.videoId]?.status === "DONE",
    ).length;

    const rewatchCount = videos.filter(
        (v) => progress[v.videoId]?.status === "REWATCH",
    ).length;

    const skippedCount = videos.filter(
        (v) => progress[v.videoId]?.status === "SKIP",
    ).length;

    const totalDurationSeconds = videos.reduce(
        (a, v) => a + v.durationSeconds,
        0,
    );

    const watchedDuration = videos
        .filter(
            (v) =>
                progress[v.videoId]?.status === "DONE" ||
                progress[v.videoId]?.status === "REWATCH",
        )
        .reduce((a, v) => a + v.durationSeconds, 0);

    const remainingDuration = formatDuration(
        Math.max(totalDurationSeconds - watchedDuration, 0),
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
                {celebrate &&
                viewport.width > 0 &&
                viewport.height > 0 &&
                isComplete ? (
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
            className="relative flex h-[calc(100dvh-4rem)] flex-col gap-4 md:p-4 p-2"
            style={{
                backgroundImage:
                    "radial-gradient(circle at top, hsl(var(--primary) / 0.12), transparent 42%), radial-gradient(circle at bottom right, hsl(var(--accent) / 0.08), transparent 28%)",
            }}
        >
            {celebrate &&
            viewport.width > 0 &&
            viewport.height > 0 &&
            isComplete ? (
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
