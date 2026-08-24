const CACHE_VERSION = "2026-05-24";
const STATIC_CACHE = `playlist-predator-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `playlist-predator-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
    "/",
    OFFLINE_URL,
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/icon-192x192.png",
    "/icon-512x512.png",
    "/logo.gif",
    "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter(
                            (key) =>
                                key !== STATIC_CACHE && key !== RUNTIME_CACHE,
                        )
                        .map((key) => caches.delete(key)),
                ),
            ),
    );
    self.clients.claim();
});

const isDev =
    self.location.hostname === "localhost" ||
    self.location.hostname === "127.0.0.1" ||
    self.location.hostname === "[::1]";

self.addEventListener("fetch", (event) => {
    if (isDev) {
        return;
    }

    const { request } = event;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        if (request.destination === "image") {
            event.respondWith(cacheFirst(request));
        }

        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(networkFirst(request));
        return;
    }

    if (
        request.destination === "style" ||
        request.destination === "script" ||
        request.destination === "font" ||
        request.destination === "image" ||
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.startsWith("/_next/image")
    ) {
        event.respondWith(cacheFirst(request));
    }
});

async function cacheFirst(request) {
    const cached = await caches.match(request);

    if (cached) {
        return cached;
    }

    const response = await fetch(request);

    if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
    }

    return response;
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }

        return response;
    } catch {
        const cached = await caches.match(request);

        if (cached) {
            return cached;
        }

        const fallback = await caches.match(OFFLINE_URL);

        return fallback || Response.error();
    }
}
