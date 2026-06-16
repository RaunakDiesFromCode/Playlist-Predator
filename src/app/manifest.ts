import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "/",
        name: "Playlist Predator",
        short_name: "PlaylistPredator",
        description:
            "Track, manage, and master your YouTube playlists and videos.",
        start_url: "/",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        background_color: "#000000",
        theme_color: "#ffffff",
        categories: ["productivity", "video", "social"],
        icons: [
            {
                src: "/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
        shortcuts: [
            {
                name: "Home",
                short_name: "Home",
                url: "/",
            },
            {
                name: "Compare Playlists",
                short_name: "Compare",
                url: "/compare",
            },
            {
                name: "Insights",
                short_name: "Insights",
                url: "/insights",
            },
        ],
    };
}
