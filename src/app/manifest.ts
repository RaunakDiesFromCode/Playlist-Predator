import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "/",
        name: "Playlist Predator",
        short_name: "PlaylistPredator",
        description: "An app to manage and enhance your YouTube playlists.",
        start_url: "/",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#09090b",
        categories: ["productivity", "video", "social"],
        icons: [
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
                purpose: "maskable",
            },
        ],
    };
}
