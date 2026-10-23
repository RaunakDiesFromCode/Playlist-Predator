"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, History, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { parseYouTubeInput } from "@/lib/youtube/input";
import { removeRecentPlaylist } from "@/lib/sidebar/playlists";
import {
    isAnniversaryActive,
    getAnniversaryMessage,
} from "@/lib/time/anniversary";

const GREETINGS = [
    "Make sense of your YouTube playlist",
    "Turn chaos into watch order",
    "Finish the playlist you abandoned",
    "Track what you watched and skipped",
    "Stop rewatching the same damn video",
    "See where you dropped off",
    "Bring order to your YouTube mess",
    "Turn Watch Later into Watched",
    "Your playlist, finally under control",
    "Because YouTube won’t manage your shit",
    "From endless scroll to actual progress",
    "Understand your binge habits",
    "Tame that out-of-hand playlist",
    "Watch smarter, not longer",
    "Separate gold from algorithmic junk",
];

function pickGreeting() {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

export default function HomeClient() {
    const [input, setInput] = useState("");
    const [greetingBase, setGreetingBase] = useState(GREETINGS[0]);
    const [isAnniversary, setIsAnniversary] = useState(isAnniversaryActive);
    const [anniversaryMsg, setAnniversaryMsg] = useState(getAnniversaryMessage);
    const [recentPlaylists, setRecentPlaylists] = useState<
        Array<{
            id: string;
            title: string;
            thumbnail?: string | null;
            channelTitle?: string | null;
        }>
    >([]);
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        setGreetingBase(pickGreeting());
        setIsAnniversary(isAnniversaryActive());
        setAnniversaryMsg(getAnniversaryMessage());

        // 1. Load from localStorage immediately
        let localList: Array<{
            id: string;
            title: string;
            thumbnail?: string | null;
            channelTitle?: string | null;
        }> = [];

        try {
            const raw = localStorage.getItem("recent_playlists");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    localList = parsed;
                }
            }
        } catch {}

        if (localList.length > 0) {
            setRecentPlaylists(localList.slice(0, 4));
        }

        // 2. Cross-reference with API for logged-in user to prune deleted playlists
        fetch("/api/playlists")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!Array.isArray(data)) return;

                const dbPlaylistIds = new Set(
                    data.map(
                        (p: { youtube_playlist_id: string }) =>
                            p.youtube_playlist_id,
                    ),
                );

                if (localList.length > 0) {
                    const validRecent = localList.filter((p) =>
                        dbPlaylistIds.has(p.id),
                    );

                    if (validRecent.length !== localList.length) {
                        try {
                            localStorage.setItem(
                                "recent_playlists",
                                JSON.stringify(validRecent),
                            );
                        } catch {}
                    }

                    if (validRecent.length > 0) {
                        setRecentPlaylists(validRecent.slice(0, 4));
                    } else if (data.length > 0) {
                        setRecentPlaylists(
                            data.slice(0, 4).map((p) => ({
                                id: p.youtube_playlist_id,
                                title: p.title || p.youtube_playlist_id,
                                thumbnail: p.thumbnail,
                            })),
                        );
                    } else {
                        setRecentPlaylists([]);
                    }
                } else if (data.length > 0) {
                    setRecentPlaylists(
                        data.slice(0, 4).map((p) => ({
                            id: p.youtube_playlist_id,
                            title: p.title || p.youtube_playlist_id,
                            thumbnail: p.thumbnail,
                        })),
                    );
                }
            })
            .catch(() => {});
    }, []);

    // Listen for playlist deletion events and remove immediately from state
    useEffect(() => {
        function handlePlaylistDeleted(event: Event) {
            const customEvent = event as CustomEvent<{
                youtubePlaylistId?: string;
            }>;
            const deletedId = customEvent.detail?.youtubePlaylistId;
            if (deletedId) {
                setRecentPlaylists((prev) =>
                    prev.filter((item) => item.id !== deletedId),
                );
            }
        }

        window.addEventListener(
            "sidebar:playlist-deleted",
            handlePlaylistDeleted,
        );
        return () => {
            window.removeEventListener(
                "sidebar:playlist-deleted",
                handlePlaylistDeleted,
            );
        };
    }, []);

    const greeting =
        !loading && user?.name ? `${greetingBase}, ${user.name}` : greetingBase;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const id = parseYouTubeInput(input)?.id;

        if (!id) return;

        router.push(`/${id}`);
    }

    return (
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-4 sm:py-6">
            <div className="flex w-full max-w-xl flex-col gap-4">
                {isAnniversary && anniversaryMsg && (
                    <p className="text-center text-xs sm:text-sm font-medium text-primary tracking-wide -mb-2">
                        {anniversaryMsg}
                    </p>
                )}
                <h1 className="text-center text-2xl font-bold sm:text-3xl break-words">
                    {greeting}
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="flex w-full items-center justify-center gap-2 rounded-none border p-1"
                >
                    <Label htmlFor="home-playlist-input" className="sr-only">
                        YouTube playlist or video link
                    </Label>
                    <Input
                        id="home-playlist-input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste YouTube playlist or video link"
                        className="min-w-0 border-none outline-none focus:ring-0"
                    />
                    <Button
                        size="icon"
                        aria-label="Analyze playlist or video"
                        className="shrink-0"
                    >
                        <ArrowRight />
                    </Button>
                </form>

                {recentPlaylists.length > 0 && (
                    <div className="w-full space-y-2 mt-4">
                        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>Recently Viewed</span>
                            <History className="h-3.5 w-3.5" />
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {recentPlaylists.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/${item.id}`}
                                    scroll={false}
                                    className="group flex items-center gap-2.5 rounded-none border border-border bg-card/60 p-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
                                >
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-none bg-muted text-[11px] font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        {item.title.trim().charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-foreground">
                                            {item.title}
                                        </p>
                                        {item.channelTitle && (
                                            <p className="truncate text-[10px] text-muted-foreground">
                                                {item.channelTitle}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Remove from recently viewed"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            removeRecentPlaylist(item.id);
                                            setRecentPlaylists((prev) =>
                                                prev.filter(
                                                    (p) => p.id !== item.id,
                                                ),
                                            );
                                        }}
                                        className="shrink-0 p-1 text-muted-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap justify-center gap-2 mt-6 sm:mt-8">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="gap-2"
                                >
                                    <Link href="/compare">
                                        Compare playlists
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Compare up to 4 playlists side by side</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="gap-2"
                                >
                                    <Link href="/insights">View Insights</Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Track your progress across playlists</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </main>
    );
}
