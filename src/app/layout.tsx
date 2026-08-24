import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Body from "./Body";
import TopLoader from "@/components/TopLoader";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
    title: {
        default: "Playlist Predator",
        template: "%s | Playlist Predator",
    },
    description: "An app to manage and enhance your YouTube playlists.",
    applicationName: "Playlist Predator",
    manifest: "/manifest.webmanifest",
    icons: {
        icon: ["/favicon.ico"],
        apple: "/apple-touch-icon.png",
    },
    appleWebApp: {
        capable: true,
        title: "Playlist Predator",
        statusBarStyle: "default",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${jetbrainsMono.variable} font-mono`}
        >
            <Body>
                <TopLoader />
                {children}
                <Analytics />
            </Body>
        </html>
    );
}
