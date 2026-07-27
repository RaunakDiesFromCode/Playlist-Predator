"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";

import { VideoMetadata } from "@/types/playlist";
import { cn } from "@/lib/utils";

interface PlayerProps {
    video: VideoMetadata | null;
    onClose: () => void;
}

function getYouTubeEmbedUrl(video: VideoMetadata) {
    return `https://www.youtube.com/embed/${video.videoId}?rel=0`;
}

function getYouTubeWatchUrl(video: VideoMetadata) {
    return video.watchUrl ?? `https://www.youtube.com/watch?v=${video.videoId}`;
}

export default function Player({ video, onClose }: PlayerProps) {
    const [open, setOpen] = useState(false);
    const [displayed, setDisplayed] = useState<VideoMetadata | null>(null);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (video) {
            // Opening: mount content, then animate open on next frame
            setDisplayed(video);
            requestAnimationFrame(() => setOpen(true));
        } else {
            // Closing: animate closed, then unmount after transition
            setOpen(false);
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
                        {/* Iframe */}
                        <div className="relative w-full h-[80dvh] bg-black">
                            <iframe
                                src={getYouTubeEmbedUrl(displayed)}
                                title={displayed.title}
                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="absolute inset-0 h-full w-full"
                            />
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

                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={getYouTubeWatchUrl(displayed)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-none border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Open in YouTube
                                </a>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="inline-flex items-center justify-center rounded-none border border-border bg-background p-1.5 hover:bg-muted transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
