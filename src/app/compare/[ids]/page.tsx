import type { Metadata } from "next";

import ComparisonClient from "@/components/comparison/comparison-client";
import { parseComparisonSlug } from "@/lib/comparison/comparison-slug";

type ComparePlaylistPageProps = {
    params: Promise<{
        ids: string;
    }>;
};

export const metadata: Metadata = {
    title: "Compare Playlists | Playlist Predator",
    description:
        "Compare multiple YouTube playlists side by side before choosing what to study.",
};

export default async function ComparePlaylistPage({
    params,
}: ComparePlaylistPageProps) {
    const { ids } = await params;

    return <ComparisonClient initialInputs={parseComparisonSlug(ids)} />;
}
