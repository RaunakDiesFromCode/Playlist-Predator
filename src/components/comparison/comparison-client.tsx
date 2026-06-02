"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
    ArrowRightLeft,
    AlertCircle,
    Check,
    Loader2,
    Minus,
    Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import ComparisonTable from "./comparison-table";

import type {
    ComparisonResult,
    ComparisonSuccessItem,
} from "@/lib/comparison/compare-playlists";
import type { ComparisonHighlight } from "@/lib/comparison/comparison-metrics";

type InputRow = {
    id: string;
    value: string;
};

const INITIAL_ROWS: InputRow[] = [
    { id: "playlist-1", value: "" },
    { id: "playlist-2", value: "" },
];

const MAX_ROWS = 4;

const toneClasses: Record<HighlightTone, string> = {
    emerald: "border-emerald-500/20 bg-emerald-500/5",
    amber: "border-amber-500/20 bg-amber-500/5",
    sky: "border-sky-500/20 bg-sky-500/5",
    rose: "border-rose-500/20 bg-rose-500/5",
};

function createRow(): InputRow {
    return {
        id: `playlist-${Math.random().toString(36).slice(2, 10)}`,
        value: "",
    };
}

export default function ComparisonClient() {
    const [rows, setRows] = useState<InputRow[]>(INITIAL_ROWS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ComparisonResult | null>(null);

    const filledRows = useMemo(
        () => rows.map((row) => row.value.trim()).filter(Boolean),
        [rows],
    );

    const successItems = useMemo(
        () => result?.items.filter(isSuccessItem) ?? [],
        [result],
    );

    const highlights = useMemo<ComparisonHighlight[]>(
        () => result?.highlights ?? [],
        [result],
    );

    function updateRow(id: string, value: string) {
        setRows((current) =>
            current.map((row) => (row.id === id ? { ...row, value } : row)),
        );
    }

    function addRow() {
        setRows((current) =>
            current.length >= MAX_ROWS ? current : [...current, createRow()],
        );
    }

    function removeRow(id: string) {
        setRows((current) => {
            if (current.length <= 2) {
                return current;
            }

            return current.filter((row) => row.id !== id);
        });
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (filledRows.length < 2) {
            setError("Enter at least two playlist URLs or IDs.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/comparison", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inputs: filledRows.slice(0, MAX_ROWS) }),
            });

            const data = (await response.json()) as ComparisonResult & {
                error?: string;
            };

            if (!response.ok) {
                throw new Error(data.error ?? "Failed to compare playlists.");
            }

            setResult(data);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Failed to compare playlists.",
            );
            setResult(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-6">
            <section className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            Playlist comparison
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Compare playlists side by side
                            </h1>
                            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                                Paste 2 to 4 playlist URLs or IDs to see total
                                duration, playback time at different speeds, and
                                simple study-time insights.
                            </p>
                        </div>
                    </div>

                    <Button asChild variant="outline" className="w-fit gap-2">
                        <Link href="/">
                            <Check className="h-4 w-4" />
                            Analyze a playlist
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        {rows.map((row, index) => (
                            <div key={row.id} className="space-y-2">
                                <Label
                                    htmlFor={row.id}
                                    className="text-sm font-medium"
                                >
                                    Playlist {index + 1}
                                </Label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input
                                        id={row.id}
                                        value={row.value}
                                        onChange={(event) =>
                                            updateRow(
                                                row.id,
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Paste a playlist URL or ID"
                                        className="h-11 flex-1"
                                    />
                                    {rows.length > 2 ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-11 w-full shrink-0 sm:w-11"
                                            onClick={() => removeRow(row.id)}
                                            aria-label={`Remove playlist ${index + 1}`}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addRow}
                            disabled={rows.length >= MAX_ROWS}
                            className="w-full gap-2 sm:w-auto"
                        >
                            <Plus className="h-4 w-4" />
                            Add another playlist
                        </Button>

                        <Button
                            type="submit"
                            disabled={loading || filledRows.length < 2}
                            className="w-full gap-2 sm:w-auto"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}
                            Compare playlists
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Supports playlist URLs and playlist IDs. Private or
                        unavailable playlists will show an inline error instead
                        of breaking the whole comparison.
                    </p>
                </form>

                {error ? (
                    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                ) : null}
            </section>

            {result ? (
                <>
                    {successItems.length >= 2 ? (
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {highlights.map((highlight) => (
                                <a
                                    key={`${highlight.kind}-${highlight.playlistId}`}
                                    href={highlight.youtubeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block h-full"
                                >
                                    <Card
                                        className={cn(
                                            "h-full overflow-hidden border shadow-sm transition-colors",
                                            toneClasses[
                                                toneForHighlight(highlight.kind)
                                            ],
                                        )}
                                    >
                                        <CardContent className="flex h-full flex-col gap-4 p-5">
                                            <div className="flex items-start gap-4">
                                                <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                                                    {highlight.thumbnail ? (
                                                        <Image
                                                            src={
                                                                highlight.thumbnail
                                                            }
                                                            alt={
                                                                highlight.title
                                                            }
                                                            fill
                                                            sizes="96px"
                                                            className="object-cover"
                                                        />
                                                    ) : null}
                                                </div>

                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <Badge
                                                        variant="secondary"
                                                        className="w-fit"
                                                    >
                                                        {highlight.label}
                                                    </Badge>
                                                    <h3 className="truncate text-lg font-semibold leading-tight">
                                                        {highlight.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {highlight.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                                    {metricValueForHighlight(
                                                        highlight,
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {metricDetailForHighlight(
                                                        highlight,
                                                    )}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </a>
                            ))}
                        </section>
                    ) : (
                        <Card className="border-dashed bg-muted/30">
                            <CardContent className="flex flex-col gap-2 p-6 text-sm text-muted-foreground">
                                <p className="font-medium text-foreground">
                                    Need at least two valid playlists to build
                                    comparison cards.
                                </p>
                                <p>
                                    Fix the invalid entries above or add another
                                    playlist to unlock the side-by-side metrics.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Separator />

                    <Card className="border-dashed bg-muted/30 shadow-sm">
                        <CardHeader className="space-y-2 pb-3">
                            <CardTitle className="text-lg">Insights</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Simple calculations based on the playlists you
                                entered.
                            </p>
                        </CardHeader>
                        <CardContent>
                            {result.insights.length > 0 ? (
                                <ul className="space-y-3 text-sm leading-6 text-foreground">
                                    {result.insights.map((insight) => (
                                        <li
                                            key={insight}
                                            className="rounded-lg border bg-background px-4 py-3 shadow-sm"
                                        >
                                            {insight}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Add at least two valid playlists to generate
                                    comparison insights.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <ComparisonTable
                        items={result.items}
                        highlights={result.highlights}
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Comparison summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                            <div className="rounded-lg border bg-muted/30 px-4 py-3">
                                <p className="font-medium text-foreground">
                                    {successItems.length} valid playlist(s)
                                </p>
                                <p>Ready for direct comparison.</p>
                            </div>
                            <div className="rounded-lg border bg-muted/30 px-4 py-3">
                                <p className="font-medium text-foreground">
                                    {
                                        result.items.filter(
                                            (item) => item.status === "error",
                                        ).length
                                    }{" "}
                                    issue(s)
                                </p>
                                <p>
                                    Invalid or unavailable playlists are
                                    isolated.
                                </p>
                            </div>
                            <div className="rounded-lg border bg-muted/30 px-4 py-3">
                                <p className="font-medium text-foreground">
                                    {filledRows.length} submitted input(s)
                                </p>
                                <p>
                                    Comparison stays within the supported 2 to 4
                                    range.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : null}
        </main>
    );
}

function isSuccessItem(
    item: ComparisonResult["items"][number],
): item is ComparisonSuccessItem {
    return item.status === "success";
}

type HighlightTone = "emerald" | "amber" | "sky" | "rose";

function toneForHighlight(kind: string): HighlightTone {
    switch (kind) {
        case "shortest":
            return "emerald";
        case "longest":
            return "amber";
        case "most-videos":
            return "sky";
        case "fewest-videos":
            return "rose";
        default:
            return "sky";
    }
}

function metricValueForHighlight(highlight: ComparisonHighlight) {
    switch (highlight.kind) {
        case "shortest":
        case "longest":
            return highlight.metrics.totalDuration;
        case "most-videos":
        case "fewest-videos":
            return `${highlight.metrics.totalVideos} videos`;
    }
}

function metricDetailForHighlight(highlight: ComparisonHighlight) {
    switch (highlight.kind) {
        case "shortest":
            return "Fastest to finish at normal speed.";
        case "longest":
            return "Takes the most time at normal speed.";
        case "most-videos":
            return "Largest playlist by count.";
        case "fewest-videos":
            return "Smallest playlist by count.";
    }
}
