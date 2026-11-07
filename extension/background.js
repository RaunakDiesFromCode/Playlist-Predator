/**
 * Playlist Predator - Chrome Extension Service Worker
 * Coordinates authentication, active playlist tracking, and progress syncing.
 */

const DEFAULT_BASE_URL = "https://playlist-predator.vercel.app";
const KNOWN_DOMAINS = [
    "https://playlist-predator.vercel.app",
    "https://predator.raunakm.xyz"
];

// Helper: Get configured Base URL
async function getBaseUrl() {
    const data = await chrome.storage.local.get("baseUrl");
    return (data.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

// Resilient API fetch that automatically falls back across known production domains
async function apiFetch(path, options = {}) {
    const configuredBase = await getBaseUrl();
    const tryUrls = [configuredBase];

    for (const d of KNOWN_DOMAINS) {
        if (!tryUrls.includes(d)) {
            tryUrls.push(d);
        }
    }

    let lastError = null;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    for (const base of tryUrls) {
        try {
            const url = `${base}${cleanPath}`;
            const res = await fetch(url, options);

            // If we succeeded on a fallback domain, update stored baseUrl
            if (base !== configuredBase && (res.ok || res.status === 401 || res.status === 404)) {
                await chrome.storage.local.set({ baseUrl: base });
            }

            return res;
        } catch (err) {
            console.warn(`[Predator Ext] fetch failed for ${base}${cleanPath}:`, err);
            lastError = err;
        }
    }

    throw lastError || new Error("Failed to connect to Playlist Predator");
}

// Helper: Get current Auth state
async function getAuth() {
    const data = await chrome.storage.local.get("auth");
    return data.auth || { authenticated: false, user: null, token: null };
}

// Helper: Get Active Playlist state
async function getActivePlaylist() {
    const data = await chrome.storage.local.get("activePlaylist");
    return data.activePlaylist || null;
}

// Helper: Get Progress Cache for an active playlist
async function getProgressCache(playlistId) {
    const data = await chrome.storage.local.get("progressCache");
    const cache = data.progressCache || {};
    return cache[playlistId] || {};
}

// Helper: Save Progress Cache
async function setProgressCache(playlistId, progress) {
    const data = await chrome.storage.local.get("progressCache");
    const cache = data.progressCache || {};
    cache[playlistId] = progress;
    await chrome.storage.local.set({ progressCache: cache });
}

// Helper: Extract Supabase access_token directly from cookies
async function getSupabaseTokenFromCookies(baseUrl) {
    try {
        const urlObj = new URL(baseUrl);
        const candidateHosts = [urlObj.hostname];
        if (urlObj.hostname === "playlist-predator.vercel.app") {
            candidateHosts.push("predator.raunakm.xyz");
        } else if (urlObj.hostname === "predator.raunakm.xyz") {
            candidateHosts.push("playlist-predator.vercel.app");
        }

        for (const host of candidateHosts) {
            const cookies = await chrome.cookies.getAll({ domain: host });
            const authCookies = cookies.filter((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
            if (!authCookies.length) continue;

            // Sort chunk indices numerically (.0, .1, .2 ... .10)
            authCookies.sort((a, b) => {
                const getChunk = (name) => {
                    const m = name.match(/\.(\d+)$/);
                    return m ? parseInt(m[1], 10) : 0;
                };
                return getChunk(a.name) - getChunk(b.name);
            });

            const combined = authCookies.map((c) => c.value).join("");

            let raw = combined;
            try {
                raw = decodeURIComponent(combined);
            } catch {}

            if (raw.startsWith("base64-")) {
                try {
                    const json = atob(raw.slice(7));
                    const parsed = JSON.parse(json);
                    const token = parsed.access_token || parsed[0];
                    if (token) return token;
                } catch {}
            }

            try {
                const parsed = JSON.parse(raw);
                const token = parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null);
                if (token) return token;
            } catch {}
        }
    } catch (e) {
        console.warn("[Predator Ext] Error extracting token from cookies:", e);
    }
    return null;
}

// Proactively inspect open tabs to detect active Predator playlist
async function detectActivePlaylistFromTabs() {
    try {
        const tabs = await chrome.tabs.query({
            url: [
                "https://playlist-predator.vercel.app/*",
                "https://predator.raunakm.xyz/*",
                "http://localhost/*",
                "http://127.0.0.1/*"
            ]
        });

        const ignored = new Set(["", "login", "register", "forgot-password", "reset-password", "insights", "compare", "admin"]);

        for (const tab of tabs) {
            if (!tab.url) continue;
            try {
                const url = new URL(tab.url);
                const pathname = url.pathname.replace(/^\/+|\/+$/g, "");

                if (pathname && !ignored.has(pathname)) {
                    if (url.origin) {
                        await chrome.storage.local.set({ baseUrl: url.origin });
                    }

                    let tabInfo = null;
                    if (tab.id) {
                        try {
                            tabInfo = await chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_PLAYLIST" });
                        } catch {
                            try {
                                await chrome.scripting.executeScript({
                                    target: { tabId: tab.id },
                                    files: ["predator-bridge.js"]
                                });
                                tabInfo = await chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_PLAYLIST" }).catch(() => null);
                            } catch {}
                        }
                    }

                    const playlistId = tabInfo?.playlistId || pathname;
                    const cleanTitle = (tabInfo?.title || tab.title || playlistId).replace(/\s*\|\s*Playlist Predator.*$/i, "").trim();

                    const current = await getActivePlaylist();
                    const activePlaylist = {
                        playlistId,
                        title: cleanTitle || playlistId,
                        videoIds: tabInfo?.videoIds || current?.videoIds || [],
                        totalVideos: tabInfo?.totalVideos || current?.totalVideos || 0,
                        origin: url.origin,
                        updatedAt: Date.now(),
                    };

                    await chrome.storage.local.set({ activePlaylist });
                    void fetchPlaylistProgress(playlistId);
                    return activePlaylist;
                }
            } catch (err) {
                console.warn("[Predator Ext] Error parsing tab URL:", err);
            }
        }
    } catch (e) {
        console.error("[Predator Ext] Error in detectActivePlaylistFromTabs:", e);
    }
    return null;
}

// Fetch latest progress from Predator API
async function fetchPlaylistProgress(playlistId) {
    if (!playlistId) return null;
    try {
        const baseUrl = await getBaseUrl();
        const auth = await getAuth();
        const token = auth.token || (await getSupabaseTokenFromCookies(baseUrl));

        const headers = { "Content-Type": "application/json" };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await apiFetch(`/api/progress?playlistId=${encodeURIComponent(playlistId)}`, {
            method: "GET",
            headers,
            credentials: "include",
        });

        if (!res.ok) {
            console.warn("[Predator Ext] Failed to fetch progress from API:", res.status);
            return null;
        }

        const progress = await res.json();
        await setProgressCache(playlistId, progress);
        return progress;
    } catch (err) {
        console.error("[Predator Ext] Error fetching progress:", err);
        return null;
    }
}

// Notify open Playlist Predator tabs to refresh their progress
async function notifyPredatorTabsToRefresh() {
    try {
        const tabs = await chrome.tabs.query({
            url: [
                "https://playlist-predator.vercel.app/*",
                "https://predator.raunakm.xyz/*",
                "http://localhost/*",
                "http://127.0.0.1/*"
            ]
        });

        for (const tab of tabs) {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { type: "EXTENSION_PROGRESS_SYNCED" }).catch(() => {});
            }
        }
    } catch (err) {
        console.error("[Predator Ext] Error notifying Predator tabs:", err);
    }
}

// Listen to tab updates and activations
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === "complete") {
        void detectActivePlaylistFromTabs();
    }
});

chrome.tabs.onActivated.addListener(() => {
    void detectActivePlaylistFromTabs();
});

// Initialize on install or startup
chrome.runtime.onInstalled.addListener(async () => {
    const existing = await chrome.storage.local.get(["baseUrl", "syncThreshold"]);
    if (!existing.baseUrl) {
        await chrome.storage.local.set({ baseUrl: DEFAULT_BASE_URL });
    }
    if (!existing.syncThreshold) {
        await chrome.storage.local.set({ syncThreshold: 85 });
    }
    void detectActivePlaylistFromTabs();
    console.log("[Predator Ext] Service worker installed.");
});

chrome.runtime.onStartup.addListener(() => {
    void detectActivePlaylistFromTabs();
});

// Central Message Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            switch (message.type) {
                case "GET_STATUS": {
                    let activePlaylist = await getActivePlaylist();
                    if (!activePlaylist) {
                        activePlaylist = await detectActivePlaylistFromTabs();
                    }

                    const [baseUrl, auth] = await Promise.all([
                        getBaseUrl(),
                        getAuth()
                    ]);

                    let progress = {};
                    if (activePlaylist?.playlistId) {
                        progress = await getProgressCache(activePlaylist.playlistId);
                    }

                    sendResponse({
                        success: true,
                        baseUrl,
                        auth,
                        activePlaylist,
                        progress,
                    });
                    break;
                }

                case "SET_AUTH": {
                    const { user, token, authenticated } = message.payload;
                    await chrome.storage.local.set({
                        auth: {
                            authenticated: !!authenticated,
                            user: user || null,
                            token: token || null,
                            updatedAt: Date.now(),
                        }
                    });
                    sendResponse({ success: true });
                    break;
                }

                case "SET_ACTIVE_PLAYLIST": {
                    const { playlistId, title, videoIds, totalVideos, origin } = message.payload;
                    if (!playlistId) {
                        sendResponse({ success: false, error: "Missing playlistId" });
                        return;
                    }

                    if (origin) {
                        await chrome.storage.local.set({ baseUrl: origin });
                    }

                    const activePlaylist = {
                        playlistId,
                        title: title || playlistId,
                        videoIds: Array.isArray(videoIds) ? videoIds : [],
                        totalVideos: totalVideos || (videoIds ? videoIds.length : 0),
                        origin: origin || (await getBaseUrl()),
                        updatedAt: Date.now(),
                    };

                    await chrome.storage.local.set({ activePlaylist });
                    void fetchPlaylistProgress(playlistId);

                    sendResponse({ success: true, activePlaylist });
                    break;
                }

                case "SET_BASE_URL": {
                    const { baseUrl } = message.payload;
                    if (baseUrl) {
                        await chrome.storage.local.set({ baseUrl: baseUrl.replace(/\/+$/, "") });
                    }
                    sendResponse({ success: true, baseUrl });
                    break;
                }

                case "REFRESH_PROGRESS": {
                    let activePlaylist = await detectActivePlaylistFromTabs();
                    if (!activePlaylist) {
                        activePlaylist = await getActivePlaylist();
                    }

                    if (!activePlaylist?.playlistId) {
                        sendResponse({ success: false, error: "No active playlist" });
                        return;
                    }

                    const progress = await fetchPlaylistProgress(activePlaylist.playlistId);
                    sendResponse({ success: true, activePlaylist, progress });
                    break;
                }

                case "MARK_VIDEO_DONE": {
                    const { playlistId, videoId } = message.payload;
                    const baseUrl = await getBaseUrl();

                    // 1. Check Auth (Requirement: Logged in is a must)
                    let auth = await getAuth();
                    let token = auth.token || (await getSupabaseTokenFromCookies(baseUrl));

                    if (!auth.authenticated && !token) {
                        sendResponse({
                            success: false,
                            error: "NOT_AUTHENTICATED",
                            message: "You must be signed in to Playlist Predator to sync progress.",
                        });
                        return;
                    }

                    // 2. Check Active Playlist (Requirement: Only work on current playlist in Predator)
                    let activePlaylist = await getActivePlaylist();
                    if (!activePlaylist) {
                        activePlaylist = await detectActivePlaylistFromTabs();
                    }

                    if (!activePlaylist || activePlaylist.playlistId !== playlistId) {
                        sendResponse({
                            success: false,
                            error: "NOT_ACTIVE_PLAYLIST",
                            message: "Video does not belong to the currently active playlist in Predator.",
                        });
                        return;
                    }

                    // 3. Check existing status (Requirement: Never overwrite DONE, REWATCH, or SKIP)
                    const progress = await getProgressCache(playlistId);
                    const currentEntry = progress[videoId];
                    const currentStatus = currentEntry?.status;

                    if (currentStatus && currentStatus !== "NONE") {
                        sendResponse({
                            success: true,
                            unchanged: true,
                            currentStatus,
                            message: `Video is already '${currentStatus}' in Predator. Preserved existing state.`,
                        });
                        return;
                    }

                    // 4. Update status to DONE via API
                    const headers = { "Content-Type": "application/json" };
                    if (token) {
                        headers["Authorization"] = `Bearer ${token}`;
                    }

                    console.log(`[Predator Ext] Sending PATCH /api/progress for ${videoId}`);

                    let res;
                    try {
                        res = await apiFetch(`/api/progress`, {
                            method: "PATCH",
                            headers,
                            credentials: "include",
                            body: JSON.stringify({
                                playlistId,
                                videoId,
                                status: "DONE",
                                onlyIfStudy: true,
                            }),
                        });
                    } catch (fetchErr) {
                        console.error("[Predator Ext] Network fetch error:", fetchErr);
                        sendResponse({
                            success: false,
                            error: "NETWORK_ERROR",
                            message: "Unable to reach Playlist Predator server. Check your connection or login status.",
                        });
                        return;
                    }

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        console.error("[Predator Ext] API PATCH failed:", res.status, errData);
                        sendResponse({
                            success: false,
                            error: "API_ERROR",
                            message: errData.error || `Server responded with ${res.status}`,
                        });
                        return;
                    }

                    // 5. Update local cache
                    progress[videoId] = {
                        status: "DONE",
                        updatedAt: new Date().toISOString(),
                    };
                    await setProgressCache(playlistId, progress);

                    // 6. Notify open Predator tabs to refresh
                    void notifyPredatorTabsToRefresh();

                    console.log(`[Predator Ext] Successfully marked video ${videoId} as DONE!`);

                    sendResponse({
                        success: true,
                        updated: true,
                        videoId,
                        status: "DONE",
                    });
                    break;
                }

                default:
                    sendResponse({ success: false, error: "Unknown message type" });
            }
        } catch (error) {
            console.error("[Predator Ext] Background worker error:", error);
            sendResponse({ success: false, error: error.message || "Internal error" });
        }
    })();

    return true;
});
