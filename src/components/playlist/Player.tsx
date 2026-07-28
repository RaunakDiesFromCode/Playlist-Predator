"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Info,
    X,
} from "lucide-react";

import { VideoMetadata } from "@/types/playlist";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PlayerProps {
    video: VideoMetadata | null;
    videos: VideoMetadata[];
    onClose: () => void;
    onNavigate: (video: VideoMetadata) => void;
}

function getYouTubeEmbedUrl(video: VideoMetadata, startSeconds?: number) {
    const baseId = video.videoId.replace(/-chapter-\d+$/, "");
    const params = new URLSearchParams({ rel: "0" });
    if (startSeconds !== undefined && startSeconds > 0) {
        params.set("start", String(startSeconds));
        params.set("autoplay", "1");
    }
    return `https://www.youtube.com/embed/${baseId}?${params.toString()}`;
}

function getYouTubeWatchUrl(video: VideoMetadata) {
    return video.watchUrl ?? `https://www.youtube.com/watch?v=${video.videoId}`;
}

// ── Timestamp ➜ clickable link helpers ──────────────────────────────────────

const TIMESTAMP_RE = /(?:^|\s)((?:\d{1,2}:)?\d{1,2}:\d{2})(?=\s|$)/g;

function timestampToSeconds(ts: string): number {
    const parts = ts.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return parts[0] * 60 + parts[1];
}

/** Turn URLs and timestamps into clickable elements. */
function formatDescription(raw: string, onSeek: (seconds: number) => void) {
    return raw.split(/\r?\n/).map((line, lineIdx) => {
        const parts: (string | JSX.Element)[] = [];
        let cursor = 0;

        // Match timestamps
        const tsMatches = [...line.matchAll(TIMESTAMP_RE)];
        for (const m of tsMatches) {
            const matchStart = m.index! + (m[0].length - m[1].length); // offset for leading whitespace
            if (matchStart > cursor) {
                parts.push(...linkifyUrls(line.slice(cursor, matchStart), `${lineIdx}-pre-${cursor}`));
            }
            const seconds = timestampToSeconds(m[1]);
            parts.push(
                <button
                    key={`${lineIdx}-ts-${matchStart}`}
                    type="button"
                    onClick={() => onSeek(seconds)}
                    className="text-blue-500 hover:underline cursor-pointer"
                >
                    {m[1]}
                </button>,
            );
            cursor = matchStart + m[1].length;
        }

        if (cursor < line.length) {
            parts.push(...linkifyUrls(line.slice(cursor), `${lineIdx}-tail`));
        }

        if (parts.length === 0) parts.push("");

        return (
            <span key={lineIdx}>
                {parts}
                {"\n"}
            </span>
        );
    });
}

const URL_RE = /https?:\/\/[^\s)]+/g;

function linkifyUrls(text: string, keyPrefix: string): (string | JSX.Element)[] {
    const parts: (string | JSX.Element)[] = [];
    let cursor = 0;
    for (const m of text.matchAll(URL_RE)) {
        if (m.index! > cursor) parts.push(text.slice(cursor, m.index));
        parts.push(
            <a
                key={`${keyPrefix}-url-${m.index}`}
                href={m[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all"
            >
                {m[0]}
            </a>,
        );
        cursor = m.index! + m[0].length;
    }
    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function Player({ video, videos, onClose, onNavigate }: PlayerProps) {
    const [open, setOpen] = useState(false);
    const [displayed, setDisplayed] = useState<VideoMetadata | null>(null);
    const [showDescription, setShowDescription] = useState(false);
    const [startSeconds, setStartSeconds] = useState<number | undefined>(undefined);
    const timerRef = useRef<number | null>(null);

    const currentIndex = displayed
        ? videos.findIndex((v) => v.videoId === displayed.videoId)
        : -1;
    const isFirst = currentIndex <= 0;
    const isLast = currentIndex === -1 || currentIndex >= videos.length - 1;

    const hasDescription = !!displayed?.description?.trim();

    const handleSeek = useCallback((seconds: number) => {
        setStartSeconds(seconds);
    }, []);

    const formattedDescription = useMemo(() => {
        if (!displayed?.description?.trim()) return null;
        return formatDescription(displayed.description, handleSeek);
    }, [displayed?.description, handleSeek]);

    useEffect(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (video) {
            // Opening: mount content, then animate open on next frame
            setDisplayed(video);
            setStartSeconds(undefined);
            requestAnimationFrame(() => setOpen(true));
        } else {
            // Closing: animate closed, then unmount after transition
            setOpen(false);
            setShowDescription(false);
            timerRef.current = window.setTimeout(() => {
                setDisplayed(null);
                timerRef.current = null;
            }, 300);
        }

        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, [video]);

    return (
        <div
            className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-in-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
        >
            <div className="overflow-hidden">
                {displayed && (
                    <div className="border-b border-border bg-background">
                        {/* Player area: iframe + optional description sidebar */}
                        <div className="flex h-[80dvh]">
                            {/* Iframe — auto-shrinks when sidebar opens */}
                            <div className="relative flex-1 min-w-0 bg-black transition-all duration-300 ease-in-out">
                                <iframe
                                    src={getYouTubeEmbedUrl(displayed, startSeconds)}
                                    title={displayed.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="absolute inset-0 h-full w-full"
                                />
                            </div>

                            {/* Description sidebar */}
                            <div
                                className={cn(
                                    "shrink-0 overflow-hidden border-l border-border bg-background transition-all duration-300 ease-in-out",
                                    showDescription ? "w-95" : "w-0 border-l-0",
                                )}
                            >
                                <div className="flex h-full w-95 flex-col">
                                    {/* Sidebar header */}
                                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                                        <h4 className="text-sm font-semibold">
                                            Description
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setShowDescription(false)}
                                            className="inline-flex items-center justify-center rounded-none p-1 hover:bg-muted transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {/* Sidebar body */}
                                    <ScrollArea className="flex-1">
                                        <div className="px-4 py-3">
                                            <pre className="whitespace-pre-wrap wrap-break-word text-sm text-muted-foreground font-[inherit] leading-relaxed">
                                                {formattedDescription}
                                            </pre>
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>

                        {/* Info bar */}
                        <div className="flex items-center justify-between gap-3 px-4 py-2">
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold leading-snug line-clamp-1">
                                    {displayed.title}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {displayed.channelTitle} ·{" "}
                                    {displayed.durationFormatted}
                                </p>
                            </div>

                            <TooltipProvider delayDuration={300}>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                disabled={isFirst}
                                                onClick={() => !isFirst && onNavigate(videos[currentIndex - 1])}
                                                className="inline-flex items-center justify-center rounded-none border border-border bg-background p-1.5 hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Previous video</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                disabled={isLast}
                                                onClick={() => !isLast && onNavigate(videos[currentIndex + 1])}
                                                className="inline-flex items-center justify-center rounded-none border border-border bg-background p-1.5 hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Next video</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                disabled={!hasDescription}
                                                onClick={() => setShowDescription((v) => !v)}
                                                className={cn(
                                                    "inline-flex items-center justify-center rounded-none border border-border bg-background p-1.5 hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none",
                                                    showDescription && "bg-muted",
                                                )}
                                            >
                                                <Info className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {showDescription ? "Hide description" : "Show description"}
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <a
                                                href={getYouTubeWatchUrl(displayed)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center rounded-none border border-border bg-background p-1.5 hover:bg-muted transition-colors"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </TooltipTrigger>
                                        <TooltipContent>Open in YouTube</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="inline-flex items-center justify-center rounded-none border border-border bg-background p-1.5 hover:bg-muted transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Close player</TooltipContent>
                                    </Tooltip>
                                </div>
                            </TooltipProvider>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
