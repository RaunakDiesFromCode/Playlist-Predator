"use client";

import NextTopLoader from "nextjs-toploader";

// nextjs-toploader uses browser APIs (window, document) and must only
// render on the client. This wrapper ensures Next.js doesn't attempt
// to render it during server-side rendering.
export default function TopLoader() {
    return (
        <NextTopLoader
            color="hsl(var(--primary))"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl
            showSpinner={false}
            easing="ease"
            speed={200}
        />
    );
}
