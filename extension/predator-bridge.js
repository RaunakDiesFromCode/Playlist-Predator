/**
 * Playlist Predator - Predator Bridge Content Script
 * Runs on Playlist Predator (vercel.app / localhost).
 * Bridges authentication state and currently active playlist to the extension background.
 */

(function () {
    console.log("[Predator Ext Bridge] Initialized on Playlist Predator at", window.location.origin);

    // Sync base URL to match current origin (e.g. http://localhost:3000)
    chrome.runtime.sendMessage({
        type: "SET_BASE_URL",
        payload: { baseUrl: window.location.origin },
    }).catch(() => {});

    // 1. Detect and sync Supabase authentication
    function syncAuth() {
        try {
            let token = null;
            let user = null;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(key));
                        if (parsed?.access_token) {
                            token = parsed.access_token;
                            user = parsed.user || null;
                            break;
                        }
                    } catch {}
                }
            }

            if (token && user) {
                chrome.runtime.sendMessage({
                    type: "SET_AUTH",
                    payload: {
                        authenticated: true,
                        token,
                        user: { id: user.id, email: user.email },
                    },
                }).catch(() => {});
            } else {
                fetch("/api/auth/me", { credentials: "include" })
                    .then((res) => (res.ok ? res.json() : null))
                    .then((data) => {
                        if (data?.authenticated && data?.user) {
                            chrome.runtime.sendMessage({
                                type: "SET_AUTH",
                                payload: {
                                    authenticated: true,
                                    token: data.token || null,
                                    user: data.user,
                                },
                            }).catch(() => {});
                        }
                    })
                    .catch(() => {});
            }
        } catch (e) {
            console.error("[Predator Ext Bridge] Error syncing auth:", e);
        }
    }

    // 2. Extract active playlist details from DOM and URL
    function getActivePlaylistInfo() {
        const pathname = window.location.pathname.replace(/^\/+|\/+$/g, "");
        const ignoredRoutes = new Set(["", "login", "register", "forgot-password", "reset-password", "insights", "compare", "admin"]);

        if (ignoredRoutes.has(pathname)) {
            return null;
        }

        const playlistContainer = document.querySelector("[data-predator-playlist-id]");
        const playlistId = playlistContainer?.getAttribute("data-predator-playlist-id") || pathname;
        const playlistTitle = playlistContainer?.getAttribute("data-predator-title") || document.title.replace(/\s*\|\s*Playlist Predator.*$/i, "").trim();

        let videoIds = [];
        const rawIds = playlistContainer?.getAttribute("data-predator-video-ids");
        if (rawIds) {
            try {
                videoIds = JSON.parse(rawIds);
            } catch {}
        }

        if (!videoIds || videoIds.length === 0) {
            const videoCards = document.querySelectorAll('[id^="video-card-"]');
            videoCards.forEach((card) => {
                const id = card.id.replace("video-card-", "");
                if (id) videoIds.push(id);
            });
        }

        return {
            playlistId,
            title: playlistTitle || playlistId,
            videoIds,
            totalVideos: videoIds.length,
            origin: window.location.origin,
            url: window.location.href,
        };
    }

    function syncActivePlaylist() {
        const info = getActivePlaylistInfo();
        if (info) {
            chrome.runtime.sendMessage({
                type: "SET_ACTIVE_PLAYLIST",
                payload: info,
            }).catch(() => {});
        }
    }

    // Initial sync
    syncAuth();
    syncActivePlaylist();

    // Listen to custom DOM events dispatched by PlaylistClient
    window.addEventListener("predator:active-playlist-changed", (e) => {
        if (e.detail?.playlistId) {
            chrome.runtime.sendMessage({
                type: "SET_ACTIVE_PLAYLIST",
                payload: {
                    ...e.detail,
                    origin: window.location.origin,
                },
            }).catch(() => {});
        }
    });

    // Listen to messages from background service worker
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "GET_PAGE_PLAYLIST") {
            const info = getActivePlaylistInfo();
            sendResponse(info);
            return true;
        }
        if (message.type === "EXTENSION_PROGRESS_SYNCED") {
            console.log("[Predator Ext Bridge] Progress synced from YouTube. Triggering UI refresh.");
            window.dispatchEvent(new CustomEvent("predator:sync-progress"));
            sendResponse({ success: true });
        }
    });

    // Observer for URL changes or delayed React hydration
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            syncAuth();
            syncActivePlaylist();
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Periodic check every 5 seconds
    setInterval(() => {
        syncAuth();
        syncActivePlaylist();
    }, 5000);
})();
