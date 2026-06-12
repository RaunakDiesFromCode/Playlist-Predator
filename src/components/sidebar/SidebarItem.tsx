"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";

export default function SidebarItem({
    title,
    href,
    active,
    collapsed,
    onClickAction,
    youtubePlaylistId,
    userId,
}: {
    title: string;
    href: string;
    active?: boolean;
    thumbnail?: string | null;
    collapsed?: boolean;
    onClickAction?: () => void;
    youtubePlaylistId?: string;
    userId?: string;
}) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const initial = title.trim().charAt(0).toUpperCase() || "?";

    async function handleDelete() {
        if (!youtubePlaylistId || deleting) return;
        setDeleting(true);
        try {
            const res = await fetch(
                `/api/playlists?youtubePlaylistId=${encodeURIComponent(youtubePlaylistId)}`,
                { method: "DELETE" },
            );
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? "Failed to delete playlist");
            }
            setDeleteDialogOpen(false);
            // Dispatch custom event so Sidebar can update its cache
            if (userId && typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("sidebar:playlist-deleted", {
                        detail: {
                            userId,
                            youtubePlaylistId,
                            wasActive: active,
                            href,
                        },
                    }),
                );
            }
            // Toast after dialog closes to avoid Radix scroll-lock conflict
            setTimeout(() => toast.success("Playlist deleted"), 100);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to delete playlist",
            );
        } finally {
            setDeleting(false);
        }
    }

    const item = (
        <div
            className={cn(
                "group my-1 flex w-full min-w-0 items-center justify-start overflow-hidden rounded-none py-2 text-sm transition-all",
                collapsed ? "px-2" : "gap-3 px-3",
                active
                    ? "border border-primary/10 bg-primary/10 font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
            )}
        >
            <Link
                href={href}
                onClick={onClickAction}
                className="flex min-w-0 flex-1 items-center gap-3 w-5"
            >
                <span
                    className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-none text-[11px] font-semibold transition-colors",
                        active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                    )}
                >
                    {initial}
                </span>

                <span
                    className={cn(
                        "block min-w-0 truncate",
                        collapsed && "sr-only",
                    )}
                >
                    {title}
                </span>
            </Link>

            {!collapsed && youtubePlaylistId && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="shrink-0 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                            aria-label="Playlist actions"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Playlist
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &ldquo;{title}&rdquo;
                            and all associated data, including progress and
                            statistics. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className={cn(
                                buttonVariants({ variant: "destructive" }),
                            )}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    if (!collapsed) {
        return item;
    }

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right">{title}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
