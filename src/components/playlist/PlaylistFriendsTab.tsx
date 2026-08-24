"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    Users,
    Copy,
    Check,
    RefreshCw,
    LogOut,
    UserX,
    LogIn,
    Shield,
    Clock,
    CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { LobbyInfo, LobbyMember } from "@/types/friends";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PlaylistCrewTabProps {
    playlistId: string; // YouTube playlist ID
    totalVideos: number;
    isActive?: boolean;
}

function formatRelativeTime(isoString?: string | null): string {
    if (!isoString) return "No activity yet";

    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Active just now";
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays < 7) return `Active ${diffDays}d ago`;

    return `Active ${date.toLocaleDateString()}`;
}

export default function PlaylistFriendsTab({
    playlistId,
    totalVideos,
    isActive = true,
}: PlaylistCrewTabProps) {
    const { user, loading: authLoading } = useAuth();

    const [lobby, setLobby] = useState<LobbyInfo | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [copied, setCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [kickingUserId, setKickingUserId] = useState<string | null>(null);

    const isRefreshingRef = useRef(false);
    const hasLoadedRef = useRef(false);

    const loadLobby = useCallback(
        async (showSkeleton = false) => {
            if (!user) {
                setInitialLoading(false);
                return;
            }

            if (isRefreshingRef.current) return;
            isRefreshingRef.current = true;

            if (showSkeleton) {
                setInitialLoading(true);
            } else {
                setIsRefreshing(true);
            }

            setError(null);

            try {
                const res = await fetch(
                    `/api/friends/lobby?playlistId=${encodeURIComponent(
                        playlistId,
                    )}&totalVideos=${totalVideos}&t=${Date.now()}`,
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error ?? "Failed to load Crew data");
                }

                const data = (await res.json()) as { lobby: LobbyInfo | null };
                setLobby(data.lobby);
                hasLoadedRef.current = true;
            } catch (err) {
                if (showSkeleton || !hasLoadedRef.current) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load Crew data",
                    );
                }
            } finally {
                setInitialLoading(false);
                setIsRefreshing(false);
                isRefreshingRef.current = false;
            }
        },
        [user, playlistId, totalVideos],
    );

    // Initial mount load
    useEffect(() => {
        if (authLoading) return;
        void loadLobby(true);
    }, [authLoading, loadLobby]);

    // Automatic background polling: every 12 seconds only while tab is active and visible
    useEffect(() => {
        if (!isActive || !user || !hasLoadedRef.current) return;

        const intervalId = window.setInterval(() => {
            if (
                typeof document !== "undefined" &&
                document.visibilityState !== "visible"
            ) {
                return;
            }
            if (isRefreshingRef.current) return;
            void loadLobby(false);
        }, 12000);

        return () => window.clearInterval(intervalId);
    }, [isActive, user, loadLobby]);

    const handleManualRefresh = useCallback(async () => {
        await loadLobby(false);
        // toast.success("Crew progress updated");
    }, [loadLobby]);

    const handleCopyInvite = useCallback(() => {
        if (!lobby?.inviteToken) return;

        const origin =
            typeof window !== "undefined"
                ? window.location.origin
                : "https://playlistpredator.com";
        const inviteUrl = `${origin}/join/${lobby.inviteToken}`;

        void navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        toast.success("Crew invite link copied to clipboard");

        setTimeout(() => setCopied(false), 2000);
    }, [lobby?.inviteToken]);

    const handleRegenerateInvite = useCallback(async () => {
        if (!lobby?.playlistId) return;

        try {
            setRegenerating(true);
            const res = await fetch("/api/friends/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playlistId: lobby.playlistId }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(
                    data.error ?? "Failed to regenerate invite link",
                );
            }

            const data = (await res.json()) as { inviteToken: string };
            setLobby((prev) =>
                prev ? { ...prev, inviteToken: data.inviteToken } : null,
            );
            toast.success(
                "Generated new invite link. Previous links are now invalid.",
            );
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to regenerate invite link",
            );
        } finally {
            setRegenerating(false);
        }
    }, [lobby?.playlistId]);

    const handleLeaveLobby = useCallback(async () => {
        if (!lobby?.playlistId || !user) return;

        try {
            setLeaving(true);
            const res = await fetch("/api/friends/leave", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playlistId: lobby.playlistId }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? "Failed to leave Crew");
            }

            toast.success("You have left the Crew");
            // Do NOT remove the playlist from sidebar; refresh Crew view in-place
            await loadLobby(true);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to leave Crew",
            );
        } finally {
            setLeaving(false);
        }
    }, [lobby?.playlistId, user, loadLobby]);

    const handleKickMember = useCallback(
        async (targetUserId: string) => {
            if (!lobby?.playlistId) return;

            try {
                setKickingUserId(targetUserId);
                const res = await fetch("/api/friends/kick", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        playlistId: lobby.playlistId,
                        targetUserId,
                    }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error ?? "Failed to remove member");
                }

                setLobby((prev) =>
                    prev
                        ? {
                              ...prev,
                              members: prev.members.filter(
                                  (m) => m.userId !== targetUserId,
                              ),
                          }
                        : null,
                );
                toast.success("Member removed from Crew");
            } catch (err) {
                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Failed to remove member",
                );
            } finally {
                setKickingUserId(null);
            }
        },
        [lobby?.playlistId],
    );

    if (authLoading || initialLoading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-28 w-full rounded-none" />
                <Skeleton className="h-40 w-full rounded-none" />
                <Skeleton className="h-40 w-full rounded-none" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-none border border-border bg-muted">
                    <Users className="h-8 w-8 text-muted-foreground" />
                </div>

                <h2 className="text-xl font-bold">Playlist Crew</h2>

                <p className="max-w-xs text-sm text-muted-foreground">
                    Sign in to share persistent invite links, study together in
                    a shared Crew, and track progress together.
                </p>

                <Button asChild className="mt-2 rounded-none">
                    <Link href={`/login?redirect=/${playlistId}?tab=Crew`}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In to Join Crew
                    </Link>
                </Button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 space-y-4">
                <div className="rounded-none border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    <p className="font-semibold">Unable to load Crew</p>
                    <p className="mt-1 text-xs">{error}</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => void loadLobby(true)}
                    className="rounded-none"
                >
                    Retry
                </Button>
            </div>
        );
    }

    const inviteOrigin =
        typeof window !== "undefined"
            ? window.location.origin
            : "https://playlistpredator.com";
    const inviteUrl = lobby?.inviteToken
        ? `${inviteOrigin}/join/${lobby.inviteToken}`
        : "";

    const memberCount = lobby?.members.length ?? 1;

    return (
        <div className="flex flex-col gap-4 p-3 overflow-y-auto">
            {/* Invite Link Card */}
            {inviteUrl && (
                <Card className="rounded-none border border-border shadow-none">
                    <CardHeader className="p-3 pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-primary" />
                                Crew Invite Link
                            </CardTitle>
                            {lobby?.isOwner && (
                                <Badge
                                    variant="outline"
                                    className="rounded-none text-xs"
                                >
                                    <Shield className="mr-1 h-3 w-3 text-primary" />
                                    Owner
                                </Badge>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-3 pt-0 space-y-2.5">
                        <p className="text-xs text-muted-foreground">
                            Anyone with this link can join this playlist Crew
                            and study alongside you.
                        </p>

                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={inviteUrl}
                                className="h-9 rounded-none bg-muted/40 font-mono text-xs"
                            />

                            <Button
                                size="sm"
                                onClick={handleCopyInvite}
                                className="rounded-none shrink-0"
                            >
                                {copied ? (
                                    <>
                                        <Check className="mr-1 h-3.5 w-3.5" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-1 h-3.5 w-3.5" />
                                        Copy Link
                                    </>
                                )}
                            </Button>
                        </div>

                        {lobby?.isOwner && (
                            <div className="flex items-center justify-between pt-1 border-t border-border text-xs">
                                <span className="text-muted-foreground">
                                    Need to revoke access?
                                </span>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={regenerating}
                                            className="h-7 rounded-none text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            <RefreshCw
                                                className={`mr-1 h-3 w-3 ${
                                                    regenerating
                                                        ? "animate-spin"
                                                        : ""
                                                }`}
                                            />
                                            Regenerate Link
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-none">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Regenerate Invite Link?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will create a new invite
                                                link. Any existing links shared
                                                with others will immediately
                                                stop working. Current Crew members
                                                will remain.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="rounded-none">
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() =>
                                                    void handleRegenerateInvite()
                                                }
                                                className="rounded-none"
                                            >
                                                Regenerate
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Crew Roster Card */}
            <Card className="rounded-none border border-border shadow-none">
                <CardHeader className="p-3 pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Study Crew ({memberCount} {memberCount === 1 ? "member" : "members"})
                        </CardTitle>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={isRefreshing}
                                onClick={() => void handleManualRefresh()}
                                className="h-7 rounded-none px-2 text-xs text-muted-foreground hover:text-foreground"
                                aria-label="Refresh Crew progress"
                            >
                                <RefreshCw
                                    className={`h-3.5 w-3.5 ${
                                        isRefreshing ? "animate-spin" : ""
                                    }`}
                                />
                                <span className="ml-1 text-xs">Refresh</span>
                            </Button>

                            {!lobby?.isOwner && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={leaving}
                                            className="h-7 rounded-none text-xs text-destructive hover:bg-destructive/10"
                                        >
                                            <LogOut className="mr-1 h-3 w-3" />
                                            Leave Crew
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-none">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Leave Study Crew?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                You will leave this study Crew.
                                                Your saved playlist, notes, and progress
                                                will remain completely intact in your library.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="rounded-none">
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() =>
                                                    void handleLeaveLobby()
                                                }
                                                className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Leave Crew
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-3 pt-0 space-y-3">
                    {(!lobby?.members || lobby.members.length === 0) && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            No other members have joined this Crew yet. Share
                            the invite link above!
                        </p>
                    )}

                    {lobby?.members.map((member: LobbyMember) => {
                        const isSelf = member.userId === user.id;
                        const isMemberOwner = member.role === "owner";

                        return (
                            <div
                                key={member.userId}
                                className="rounded-none border border-border p-3 space-y-2 bg-card/60"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-none border border-border bg-muted font-bold text-xs">
                                            {member.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-sm font-medium truncate">
                                                {member.name}
                                            </span>

                                            {isSelf && (
                                                <Badge
                                                    variant="secondary"
                                                    className="rounded-none px-1.5 py-0 text-[10px]"
                                                >
                                                    You
                                                </Badge>
                                            )}

                                            {isMemberOwner ? (
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-none px-1.5 py-0 text-[10px] text-primary border-primary/30"
                                                >
                                                    Host
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-none px-1.5 py-0 text-[10px] text-muted-foreground"
                                                >
                                                    Member
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {lobby.isOwner && !isSelf && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={
                                                        kickingUserId ===
                                                        member.userId
                                                    }
                                                    className="h-7 w-7 rounded-none text-muted-foreground hover:text-destructive"
                                                    aria-label={`Remove ${member.name}`}
                                                >
                                                    <UserX className="h-3.5 w-3.5" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-none">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Remove {member.name}?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will remove{" "}
                                                        {member.name} from the
                                                        Crew. They can
                                                        only rejoin if given an
                                                        active invite link.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-none">
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() =>
                                                            void handleKickMember(
                                                                member.userId,
                                                            )
                                                        }
                                                        className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Remove from Crew
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            {member.doneCount} /{" "}
                                            {totalVideos > 0
                                                ? totalVideos
                                                : member.totalVideos}{" "}
                                            completed
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {member.completionPercentage}%
                                        </span>
                                    </div>

                                    <Progress
                                        value={member.completionPercentage}
                                        className="h-1.5 rounded-none"
                                    />
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatRelativeTime(
                                            member.lastActiveAt,
                                        )}
                                    </span>

                                    {member.rewatchCount > 0 && (
                                        <span>
                                            {member.rewatchCount} rewatching
                                        </span>
                                    )}

                                    {member.skippedCount > 0 && (
                                        <span>
                                            {member.skippedCount} skipped
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
