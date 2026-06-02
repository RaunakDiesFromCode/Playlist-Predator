import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckCircle2, Clock3, ListVideo, Percent } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateUserStats } from "@/lib/stats/calculate-user-stats";

export const metadata: Metadata = {
    title: "Your Learning Journey | Playlist Predator",
    description:
        "Track your progress across playlists and see how much content you've conquered.",
};

type PlaylistRow = {
    youtube_playlist_id: string;
};

type ProgressRow = {
    playlist_id: string;
    status: string;
    updated_at: string | null;
};

function formatLastActivity(date: Date | null) {
    if (!date) {
        return "No activity yet";
    }

    const now = new Date();
    const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
    );
    const startOfTarget = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    );
    const dayDiff = Math.round(
        (startOfToday.getTime() - startOfTarget.getTime()) /
            (24 * 60 * 60 * 1000),
    );

    if (dayDiff <= 0) {
        return "Today";
    }

    if (dayDiff === 1) {
        return "Yesterday";
    }

    if (dayDiff < 7) {
        return `${dayDiff} days ago`;
    }

    const weekDiff = Math.round(dayDiff / 7);

    if (weekDiff < 5) {
        return `${weekDiff} weeks ago`;
    }

    const monthDiff = Math.round(dayDiff / 30);

    if (monthDiff < 12) {
        return `${monthDiff} months ago`;
    }

    const yearDiff = Math.round(dayDiff / 365);
    return `${yearDiff} years ago`;
}

function formatCompletionRate(completed: number, totalTracked: number) {
    if (totalTracked === 0) {
        return "0%";
    }

    return `${Math.round((completed / totalTracked) * 100)}%`;
}

export default async function StatsPage() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const [playlistsResult, progressResult] = await Promise.all([
        supabase
            .from("playlists")
            .select("youtube_playlist_id")
            .eq("user_id", user.id),
        supabase
            .from("playlist_progress")
            .select("playlist_id, status, updated_at")
            .eq("user_id", user.id),
    ]);

    if (playlistsResult.error) {
        return (
            <section className="mx-auto w-full max-w-7xl p-4 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Statistics unavailable</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        {playlistsResult.error.message}
                    </CardContent>
                </Card>
            </section>
        );
    }

    if (progressResult.error) {
        return (
            <section className="mx-auto w-full max-w-7xl p-4 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Statistics unavailable</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        {progressResult.error.message}
                    </CardContent>
                </Card>
            </section>
        );
    }

    const playlists = (playlistsResult.data ?? []) as PlaylistRow[];
    const progressRows = (progressResult.data ?? []) as ProgressRow[];
    const hasProgress = progressRows.length > 0;

    if (!hasProgress) {
        return (
            <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 md:p-6">
                <div className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Your Learning Journey
                    </h1>
                    <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                        Track your progress across playlists and see how much
                        content you&apos;ve conquered.
                    </p>
                </div>

                <Card className="border-dashed bg-muted/30">
                    <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                                <Clock3 className="h-3.5 w-3.5" />
                                No activity yet
                            </div>
                            <p className="max-w-xl text-lg font-medium leading-7 sm:text-xl">
                                Analyze a playlist and start tracking videos to
                                build your learning history.
                            </p>
                            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Once you begin marking videos as completed,
                                skipped, or to rewatch, your dashboard will
                                start reflecting your momentum here.
                            </p>
                        </div>
                        <div>
                            <Button asChild className="shadow-sm">
                                <Link href="/">Analyze a playlist</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </section>
        );
    }

    const stats = calculateUserStats({ playlists, progressRows });
    const completionRate = formatCompletionRate(
        stats.videosCompleted,
        stats.totalTrackedVideos,
    );
    const progressTotal =
        stats.videosCompleted + stats.videosSkipped + stats.videosRewatch;
    const breakdownTotal = Math.max(progressTotal, 1);
    const completedShare = (stats.videosCompleted / breakdownTotal) * 100;
    const skippedShare = (stats.videosSkipped / breakdownTotal) * 100;
    const rewatchShare = (stats.videosRewatch / breakdownTotal) * 100;

    return (
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 md:p-6">
            <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Your Learning Journey
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Track your progress across playlists and see how much
                    content you&apos;ve conquered.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="overflow-hidden">
                    <CardContent className="space-y-3 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Playlists Tracked
                            </p>
                            <div className="rounded-full border bg-muted/60 p-2 text-muted-foreground">
                                <ListVideo className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            {stats.playlistsTracked}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Playlists you&apos;re learning from
                        </p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardContent className="space-y-3 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Videos Completed
                            </p>
                            <div className="rounded-full border bg-muted/60 p-2 text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            {stats.videosCompleted}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Videos you&apos;ve finished
                        </p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardContent className="space-y-3 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Completion Rate
                            </p>
                            <div className="rounded-full border bg-muted/60 p-2 text-muted-foreground">
                                <Percent className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            {completionRate}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Completed out of all tracked videos
                        </p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardContent className="space-y-3 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Last Activity
                            </p>
                            <div className="rounded-full border bg-muted/60 p-2 text-muted-foreground">
                                <Clock3 className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            {formatLastActivity(stats.lastActivity)}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Most recent learning session
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="overflow-hidden bg-emerald-500/[0.03]">
                    <CardContent className="space-y-3 p-4 sm:p-5">
                        <p className="text-sm font-medium text-muted-foreground">
                            Completed
                        </p>
                        <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            {stats.videosCompleted}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Videos you&apos;ve finished
                        </p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden bg-rose-500/[0.03]">
                    <CardContent className="space-y-3 p-4 sm:p-5">
                        <p className="text-sm font-medium text-muted-foreground">
                            Skipped
                        </p>
                        <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            {stats.videosSkipped}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Videos you passed for now
                        </p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden bg-amber-500/[0.03]">
                    <CardContent className="space-y-3 p-4 sm:p-5">
                        <p className="text-sm font-medium text-muted-foreground">
                            To Rewatch
                        </p>
                        <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            {stats.videosRewatch}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Videos worth another pass
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <CardHeader className="space-y-3 pb-4">
                    <CardTitle className="text-xl">
                        Progress Breakdown
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Your current status mix across tracked videos.
                    </p>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                        <div className="flex h-full w-full">
                            <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${completedShare}%` }}
                            />
                            <div
                                className="h-full bg-rose-500"
                                style={{ width: `${skippedShare}%` }}
                            />
                            <div
                                className="h-full bg-amber-500"
                                style={{ width: `${rewatchShare}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2 rounded-xl border p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <p className="font-medium">Completed</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {stats.videosCompleted}
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {Math.round(completedShare)}% of tracked videos
                            </p>
                        </div>

                        <div className="space-y-2 rounded-xl border p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                                    <p className="font-medium">Skipped</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {stats.videosSkipped}
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {Math.round(skippedShare)}% of tracked videos
                            </p>
                        </div>

                        <div className="space-y-2 rounded-xl border p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                    <p className="font-medium">To Rewatch</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {stats.videosRewatch}
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {Math.round(rewatchShare)}% of tracked videos
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
