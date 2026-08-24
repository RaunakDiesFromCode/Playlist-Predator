"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { upsertSidebarPlaylist } from "@/lib/sidebar/playlists";
import { JoinLobbyResponse } from "@/types/friends";

interface JoinClientProps {
    token: string;
}

export default function JoinClient({ token }: JoinClientProps) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasJoinedRef = useRef(false);

    useEffect(() => {
        if (authLoading || !user || hasJoinedRef.current) return;

        hasJoinedRef.current = true;
        setJoining(true);
        setError(null);

        async function performJoin() {
            try {
                const res = await fetch("/api/friends/join", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const data = (await res.json()) as JoinLobbyResponse & {
                    error?: string;
                };

                if (!res.ok || data.error) {
                    setError(data.error ?? "Invalid or expired invite link");
                    setJoining(false);
                    return;
                }

                const now = new Date().toISOString();
                upsertSidebarPlaylist(user!.id, {
                    id: data.playlistId,
                    user_id: user!.id,
                    youtube_playlist_id: data.youtubePlaylistId,
                    title: data.title,
                    thumbnail: data.thumbnail,
                    created_at: now,
                    updated_at: now,
                });

                toast.success(
                    data.role === "owner"
                        ? "Opened your playlist Crew"
                        : `Joined ${data.title ? `"${data.title}"` : "playlist"} Crew!`,
                );

                router.replace(`/${data.youtubePlaylistId}?tab=Crew`);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to join playlist Crew",
                );
                setJoining(false);
            }
        }

        void performJoin();
    }, [authLoading, user, token, router]);

    if (authLoading || joining) {
        return (
            <div className="flex min-h-[60dvh] items-center justify-center p-4">
                <Card className="w-full max-w-md rounded-none border border-border">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-none bg-primary/10 text-primary">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                        <CardTitle className="text-lg">
                            Joining Playlist Crew
                        </CardTitle>
                        <CardDescription>
                            Connecting you to the study Crew...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!user) {
        const redirectParam = encodeURIComponent(`/join/${token}`);

        return (
            <div className="flex min-h-[60dvh] items-center justify-center p-4">
                <Card className="w-full max-w-md rounded-none border border-border">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-none bg-primary/10 text-primary">
                            <Users className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">
                            Playlist Crew Invite
                        </CardTitle>
                        <CardDescription>
                            You have been invited to join a collaborative study
                            Crew on Playlist Predator.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <p className="text-sm text-center text-muted-foreground">
                            Sign in or create an account to join this playlist
                            Crew, track your progress together, and see
                            collective study stats.
                        </p>

                        <div className="flex flex-col gap-2 pt-2">
                            <Button asChild className="w-full rounded-none">
                                <Link href={`/login?redirect=${redirectParam}`}>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Login to Join Crew
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="outline"
                                className="w-full rounded-none"
                            >
                                <Link
                                    href={`/register?redirect=${redirectParam}`}
                                >
                                    Create an Account
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[60dvh] items-center justify-center p-4">
                <Card className="w-full max-w-md rounded-none border border-border">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-none bg-destructive/10 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">
                            Unable to Join Crew
                        </CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <p className="text-sm text-center text-muted-foreground">
                            This invite link may have expired, been regenerated,
                            or disabled by the Crew owner.
                        </p>

                        <Button asChild className="w-full rounded-none">
                            <Link href="/">Return to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
