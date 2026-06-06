import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/insights/empty-state";
import { LearningSummary } from "@/components/insights/learning-summary";
import { OverviewSection } from "@/components/insights/overview-section";
import { PlaylistProgress } from "@/components/insights/playlist-progress";
import { ProgressBreakdown } from "@/components/insights/progress-breakdown";
import { RecentActivity } from "@/components/insights/recent-activity";
import {
    calculateLearningSummary,
    calculateOverview,
    calculatePlaylistRankings,
    calculateProgressBreakdown,
    calculateRecentActivity,
} from "@/lib/insights/calculate-insights";

export const metadata: Metadata = {
    title: "Insights | Playlist Predator",
    description:
        "View your learning insights — completion rates, progress breakdowns, playlist rankings, and recent activity.",
};

type PlaylistRow = {
    youtube_playlist_id: string;
    title: string | null;
    thumbnail: string | null;
};

type ProgressRow = {
    playlist_id: string;
    video_id: string;
    status: string;
    updated_at: string | null;
};

export default async function InsightsPage() {
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
            .select("youtube_playlist_id, title, thumbnail")
            .eq("user_id", user.id),
        supabase
            .from("playlist_progress")
            .select("playlist_id, video_id, status, updated_at")
            .eq("user_id", user.id),
    ]);

    if (playlistsResult.error) {
        return (
            <section className="mx-auto w-full max-w-7xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Insights unavailable</CardTitle>
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
            <section className="mx-auto w-full max-w-7xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Insights unavailable</CardTitle>
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

    if (progressRows.length === 0) {
        return (
            <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4">
                <div className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Insights
                    </h1>
                    <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                        A unified view of your learning activity across
                        playlists.
                    </p>
                </div>

                <EmptyState />
            </section>
        );
    }

    const input = { playlists, progressRows };
    const overview = calculateOverview(input);
    const breakdown = calculateProgressBreakdown(input);
    const rankings = calculatePlaylistRankings(input);
    const recentActivity = calculateRecentActivity(input);
    const summary = calculateLearningSummary(overview, rankings);

    return (
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4">
            <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Insights
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    A unified view of your learning activity across playlists.
                </p>
            </div>

            <OverviewSection data={overview} />

            <div className="grid gap-4 lg:grid-cols-2">
                <ProgressBreakdown data={breakdown} />
                <PlaylistProgress data={rankings} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <RecentActivity data={recentActivity} />
                <LearningSummary data={summary} />
            </div>
        </section>
    );
}
