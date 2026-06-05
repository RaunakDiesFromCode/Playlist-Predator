import type { Metadata } from "next";

import ComparisonClient from "@/components/comparison/comparison-client";

export const metadata: Metadata = {
    title: "Compare Playlists | Playlist Predator",
    description:
        "Compare multiple YouTube playlists side by side before choosing what to study.",
};

export default function ComparePage() {
    return <ComparisonClient />;
}
