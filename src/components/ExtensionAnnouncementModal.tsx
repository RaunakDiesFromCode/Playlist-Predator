"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Chrome, Download, ExternalLink, Sparkles, Youtube } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const LAST_SHOWN_KEY = "predator_extension_popup_last_shown";
const DONT_SHOW_AGAIN_KEY = "predator_extension_popup_dismissed_permanently";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function ExtensionAnnouncementModal() {
    const [open, setOpen] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Check if permanently dismissed
        const permanentlyDismissed = localStorage.getItem(DONT_SHOW_AGAIN_KEY);
        if (permanentlyDismissed === "true") {
            return;
        }

        // Check 24-hour rate limit
        const lastShown = localStorage.getItem(LAST_SHOWN_KEY);
        const now = Date.now();

        if (!lastShown || now - parseInt(lastShown, 10) >= ONE_DAY_MS) {
            // Delay slightly to let the page settle
            const timer = window.setTimeout(() => {
                setOpen(true);
                localStorage.setItem(LAST_SHOWN_KEY, now.toString());
            }, 800);

            return () => window.clearTimeout(timer);
        }
    }, []);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            if (dontShowAgain) {
                localStorage.setItem(DONT_SHOW_AGAIN_KEY, "true");
            }
            localStorage.setItem(LAST_SHOWN_KEY, Date.now().toString());
        }
        setOpen(nextOpen);
    };

    const handleDismiss = () => {
        if (dontShowAgain) {
            localStorage.setItem(DONT_SHOW_AGAIN_KEY, "true");
        }
        localStorage.setItem(LAST_SHOWN_KEY, Date.now().toString());
        setOpen(false);
    };

    const handleGoToDocs = () => {
        if (dontShowAgain) {
            localStorage.setItem(DONT_SHOW_AGAIN_KEY, "true");
        }
        localStorage.setItem(LAST_SHOWN_KEY, Date.now().toString());
        setOpen(false);
        router.push("/docs/extension");
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl border bg-background p-6 rounded-none max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className="rounded-none border-primary/40 bg-primary/10 text-primary font-mono text-[11px] uppercase tracking-wider gap-1 py-0.5 px-2"
                        >
                            <Sparkles className="h-3 w-3" />
                            New Companion Extension
                        </Badge>
                    </div>

                    <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Introducing Hassle-Free YouTube Playlist Sync
                    </DialogTitle>

                    <DialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        Never worry about manually ticking off videos or losing your study progress again.
                        Our lightweight companion extension automatically synchronizes your YouTube watch progress
                        directly to Playlist Predator in real time.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-2 space-y-4">
                    {/* Feature Highlights Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div className="border border-border/80 bg-muted/20 p-3 space-y-1 rounded-none">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                <Youtube className="h-4 w-4 text-red-500 shrink-0" />
                                <span>Auto-Done at 85%</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Watch any lecture or video on YouTube. Reaching 85% completion automatically marks it as DONE in your playlist.
                            </p>
                        </div>

                        <div className="border border-border/80 bg-muted/20 p-3 space-y-1 rounded-none">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                <Chrome className="h-4 w-4 text-blue-500 shrink-0" />
                                <span>Active Playlist Isolation</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Only tracks videos belonging to your currently open Predator playlist. Random YouTube browsing will never pollute your data.
                            </p>
                        </div>

                        <div className="border border-border/80 bg-muted/20 p-3 space-y-1 rounded-none">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                <div className="h-4 w-4 flex items-center justify-center font-mono font-bold text-xs text-primary shrink-0">
                                    ✓
                                </div>
                                <span>Preserves Manual States</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Videos marked as REWATCH or SKIP are strictly preserved and never downgraded or overwritten.
                            </p>
                        </div>

                        <div className="border border-border/80 bg-muted/20 p-3 space-y-1 rounded-none">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                <div className="h-4 w-4 flex items-center justify-center font-mono font-bold text-xs text-emerald-500 shrink-0">
                                    ⚡
                                </div>
                                <span>Zero YouTube Login</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                No third-party account access or YouTube permissions needed. Operates seamlessly with your existing Predator login.
                            </p>
                        </div>
                    </div>

                    {/* Visual Toast Mockup Banner */}
                    <div className="border border-emerald-500/30 bg-muted/30 p-3.5 flex items-center justify-between gap-3 rounded-none">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-7 w-7 bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-sm font-bold shrink-0">
                                <Check className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">
                                    Video marked as Done! Synced with Predator
                                </p>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                    Live notification overlay appears on YouTube past 85%
                                </p>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className="rounded-none border-emerald-500/40 text-emerald-500 font-mono text-[10px] shrink-0 hidden sm:inline-flex"
                        >
                            LIVE ON YOUTUBE
                        </Badge>
                    </div>

                    {/* Don't show again toggle */}
                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="dont-show-again-checkbox"
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                            className="h-3.5 w-3.5 rounded-none border-border accent-primary cursor-pointer"
                        />
                        <label
                            htmlFor="dont-show-again-checkbox"
                            className="text-xs text-muted-foreground cursor-pointer select-none"
                        >
                            Don&apos;t show this announcement again
                        </label>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-3 flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDismiss}
                        className="rounded-none text-xs text-muted-foreground hover:text-foreground h-9"
                    >
                        Maybe Later
                    </Button>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-none h-9 text-xs font-medium gap-1.5 px-3 flex-1 sm:flex-initial"
                        >
                            <a
                                href="/api/extension/download"
                                download="playlist-predator-extension.zip"
                            >
                                <Download className="h-3.5 w-3.5 text-primary" />
                                <span>Download .zip</span>
                            </a>
                        </Button>
                        <Button
                            type="button"
                            onClick={handleGoToDocs}
                            className="rounded-none h-9 text-xs sm:text-sm font-medium gap-1.5 px-4 flex-1 sm:flex-initial"
                        >
                            <span>Open Setup Guide &amp; Docs</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
