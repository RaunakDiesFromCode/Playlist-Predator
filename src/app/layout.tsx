import "./globals.css";
import Body from "./Body";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
    title: {
        default: "Playlist Predator",
        template: "%s | Playlist Predator",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <html lang="en" suppressHydrationWarning>
            <Body>{children}</Body>
            <Analytics />
        </html>
    );
}
