"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import type { ComparisonHighlight } from "@/lib/comparison/comparison-metrics";
import type {
    ComparisonItem,
    ComparisonSuccessItem,
} from "@/lib/comparison/compare-playlists";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";

type ComparisonTableProps = {
    items: ComparisonItem[];
    highlights: ComparisonHighlight[];
};

export default function ComparisonTable({
    items,
    highlights,
}: ComparisonTableProps) {
    const highlightedPlaylistIds = new Set(
        highlights.map((highlight) => highlight.playlistId),
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Comparison Table</CardTitle>
                <CardDescription>
                    Duration estimates are based on the playlist content fetched
                    from YouTube.
                </CardDescription>
            </CardHeader>

            <CardContent className="divide-y md:hidden">
                {items.map((item) => {
                    if (item.status === "error") {
                        return (
                            <div
                                key={`${item.position}-${item.input}`}
                                className="space-y-2 px-4 py-4"
                            >
                                <p className="font-medium text-destructive">
                                    {item.input}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {item.error}
                                </p>
                            </div>
                        );
                    }

                    return (
                        <MobileComparisonRow
                            key={item.playlistId}
                            item={item}
                            isHighlighted={highlightedPlaylistIds.has(
                                item.playlistId,
                            )}
                        />
                    );
                })}
            </CardContent>

            <div className="hidden md:block px-5 py-1">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[240px]">
                                Playlist
                            </TableHead>
                            <TableHead>Videos</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>1.25x</TableHead>
                            <TableHead>1.5x</TableHead>
                            <TableHead>2x</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => {
                            if (item.status === "error") {
                                return (
                                    <TableRow
                                        key={`${item.position}-${item.input}`}
                                    >
                                        <TableCell colSpan={6}>
                                            <div className="flex flex-col gap-1">
                                                <p className="font-medium text-destructive">
                                                    {item.input}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.error}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            }

                            return (
                                <ComparisonRow
                                    key={item.playlistId}
                                    item={item}
                                    isHighlighted={highlightedPlaylistIds.has(
                                        item.playlistId,
                                    )}
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}

function ComparisonRow({
    item,
    isHighlighted,
}: {
    item: ComparisonSuccessItem;
    isHighlighted: boolean;
}) {
    return (
        <TableRow>
            <TableCell className="align-top">
                <div className="flex items-start gap-3">
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-none border bg-muted">
                        {item.thumbnail ? (
                            <Image
                                src={item.thumbnail}
                                alt={item.title}
                                fill
                                sizes="80px"
                                className="object-cover"
                            />
                        ) : null}
                    </div>

                    <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium leading-snug">
                                {item.title}
                            </span>
                            {isHighlighted ? (
                                <Badge
                                    variant="outline"
                                    className="text-[10px] uppercase tracking-wide"
                                >
                                    Compared
                                </Badge>
                            ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {item.playlist.channelTitle}
                        </p>
                    </div>
                </div>
            </TableCell>

            <TableCell className="align-top font-medium">
                {item.metrics.totalVideos}
            </TableCell>
            <TableCell className="align-top font-medium">
                {item.metrics.totalDuration}
            </TableCell>
            <TableCell className="align-top text-muted-foreground">
                {item.metrics.durationsBySpeed[1.25]}
            </TableCell>
            <TableCell className="align-top text-muted-foreground">
                {item.metrics.durationsBySpeed[1.5]}
            </TableCell>
            <TableCell className="align-top text-muted-foreground">
                {item.metrics.durationsBySpeed[2]}
            </TableCell>
        </TableRow>
    );
}

function MobileComparisonRow({
    item,
    isHighlighted,
}: {
    item: ComparisonSuccessItem;
    isHighlighted: boolean;
}) {
    return (
        <div className="space-y-4 px-4 py-4">
            <div className="flex items-start gap-3">
                <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-none border bg-muted">
                    {item.thumbnail ? (
                        <Image
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            sizes="96px"
                            className="object-cover"
                        />
                    ) : null}
                </div>

                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium leading-snug">
                            {item.title}
                        </span>
                        {isHighlighted ? (
                            <Badge
                                variant="outline"
                                className="text-[10px] uppercase tracking-wide"
                            >
                                Compared
                            </Badge>
                        ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {item.playlist.channelTitle}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Metric
                    label="Videos"
                    value={item.metrics.totalVideos.toString()}
                />
                <Metric label="Duration" value={item.metrics.totalDuration} />
                <Metric
                    label="1.25x"
                    value={item.metrics.durationsBySpeed[1.25]}
                />
                <Metric
                    label="1.5x"
                    value={item.metrics.durationsBySpeed[1.5]}
                />
                <Metric label="2x" value={item.metrics.durationsBySpeed[2]} />
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-none border bg-muted/20 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="mt-1 font-medium text-foreground">{value}</p>
        </div>
    );
}
