import type { Metadata } from "next";

import HomeClient from "./HomeClient";

export const metadata: Metadata = {
    title: "Playlist Predator",
    description:
        "Analyze, organize, and track progress across YouTube playlists.",
};

export default function HomePage() {
    return <HomeClient />;
}
