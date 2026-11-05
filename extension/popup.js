/**
 * Playlist Predator - Extension Popup Logic
 */

document.addEventListener("DOMContentLoaded", async () => {
    // DOM elements
    const statusPill = document.getElementById("status-pill");
    const statusText = document.getElementById("status-text");

    const authLoggedIn = document.getElementById("auth-logged-in");
    const authLoggedOut = document.getElementById("auth-logged-out");
    const userEmail = document.getElementById("user-email");
    const btnLogin = document.getElementById("btn-login");

    const playlistBadge = document.getElementById("playlist-badge");
    const playlistActive = document.getElementById("playlist-active");
    const playlistInactive = document.getElementById("playlist-inactive");
    const playlistTitle = document.getElementById("playlist-title");
    const playlistIdEl = document.getElementById("playlist-id");
    const playlistProgressStats = document.getElementById("playlist-progress-stats");
    const btnOpenPredator = document.getElementById("btn-open-predator");
    const btnBrowsePredator = document.getElementById("btn-browse-predator");

    const tabStatus = document.getElementById("tab-status");
    const envSelect = document.getElementById("env-select");
    const btnManualSync = document.getElementById("btn-manual-sync");

    let currentBaseUrl = "https://playlist-predator.vercel.app";
    let currentActivePlaylist = null;

    // Load status from background
    function loadStatus(callback) {
        chrome.runtime.sendMessage({ type: "GET_STATUS" }, async (response) => {
            if (chrome.runtime.lastError || !response?.success) {
                statusPill.className = "status-pill status-disconnected";
                statusText.textContent = "Error";
                if (callback) callback();
                return;
            }

            const { baseUrl, auth, activePlaylist, progress } = response;
            currentBaseUrl = baseUrl || currentBaseUrl;
            currentActivePlaylist = activePlaylist;

            // Set env select
            envSelect.value = currentBaseUrl.includes("localhost") ? "http://localhost:3000" : "https://playlist-predator.vercel.app";

            // Render Auth
            if (auth?.authenticated) {
                statusPill.className = "status-pill status-connected";
                statusText.textContent = "Connected";
                authLoggedIn.classList.remove("hidden");
                authLoggedOut.classList.add("hidden");
                userEmail.textContent = auth.user?.email || "Authenticated";
            } else {
                statusPill.className = "status-pill status-disconnected";
                statusText.textContent = "Not Logged In";
                authLoggedIn.classList.add("hidden");
                authLoggedOut.classList.remove("hidden");
            }

            // Render Active Playlist
            if (activePlaylist?.playlistId) {
                playlistBadge.textContent = "Active";
                playlistBadge.className = "badge badge-active";
                playlistActive.classList.remove("hidden");
                playlistInactive.classList.add("hidden");

                playlistTitle.textContent = activePlaylist.title || activePlaylist.playlistId;
                playlistIdEl.textContent = activePlaylist.playlistId;

                const doneCount = Object.values(progress || {}).filter((p) => p.status === "DONE").length;
                const total = activePlaylist.totalVideos || activePlaylist.videoIds?.length || 0;
                playlistProgressStats.textContent = total > 0 ? `${doneCount}/${total} done` : `${doneCount} done`;
            } else {
                playlistBadge.textContent = "None";
                playlistBadge.className = "badge";
                playlistActive.classList.add("hidden");
                playlistInactive.classList.remove("hidden");
            }

            // Check Active Tab
            await checkActiveTab(activePlaylist, progress);

            if (callback) callback(response);
        });
    }

    // Inspect the user's current browser tab
    async function checkActiveTab(activePlaylist, progress) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.url) {
                tabStatus.textContent = "Unable to read active tab.";
                return;
            }

            const url = new URL(tab.url);

            if (url.hostname.includes("youtube.com") && url.pathname.startsWith("/watch")) {
                const videoId = url.searchParams.get("v");
                const playlistId = url.searchParams.get("list");

                if (!activePlaylist?.playlistId) {
                    tabStatus.innerHTML = `<span class="text-muted">YouTube video open (${videoId}), but no active playlist is selected in Predator. Click <strong>Sync Now ↻</strong> or refresh your Predator tab.</span>`;
                    return;
                }

                const matchesPlaylist =
                    (playlistId && playlistId === activePlaylist.playlistId) ||
                    (Array.isArray(activePlaylist.videoIds) && activePlaylist.videoIds.includes(videoId));

                if (matchesPlaylist) {
                    const status = progress?.[videoId]?.status;
                    if (status && status !== "NONE") {
                        tabStatus.innerHTML = `<span style="color:#22c55e">✓ Video is already <strong>${status}</strong> in Predator.</span>`;
                    } else {
                        tabStatus.innerHTML = `<span style="color:#22c55e">● Tracking:</span> Watching video in <strong>${activePlaylist.title}</strong>. Auto-marks DONE at 85%.`;
                    }
                } else {
                    tabStatus.innerHTML = `<span class="text-muted">Watching video <code>${videoId}</code> — not part of active playlist <em>${activePlaylist.title}</em>. Syncing paused.</span>`;
                }
            } else if (url.hostname.includes("playlist-predator.vercel.app") || url.hostname.includes("localhost")) {
                tabStatus.innerHTML = `<span style="color:#22c55e">● Active:</span> Viewing Playlist Predator app.`;
            } else {
                tabStatus.textContent = "Not on YouTube. Open YouTube to track videos.";
            }
        } catch {
            tabStatus.textContent = "Unable to inspect active tab.";
        }
    }

    // Button: Open in Playlist Predator
    btnOpenPredator.addEventListener("click", () => {
        if (!currentActivePlaylist?.playlistId) return;
        const targetUrl = `${currentBaseUrl}/${currentActivePlaylist.playlistId}`;
        chrome.tabs.create({ url: targetUrl });
    });

    // Button: Go to Predator Browse
    btnBrowsePredator.addEventListener("click", () => {
        chrome.tabs.create({ url: currentBaseUrl });
    });

    // Button: Login
    btnLogin.addEventListener("click", () => {
        chrome.tabs.create({ url: `${currentBaseUrl}/login` });
    });

    // Change Base URL
    envSelect.addEventListener("change", (e) => {
        const nextUrl = e.target.value;
        chrome.runtime.sendMessage({
            type: "SET_BASE_URL",
            payload: { baseUrl: nextUrl },
        }, () => {
            loadStatus();
        });
    });

    // Button: Manual Sync
    btnManualSync.addEventListener("click", () => {
        btnManualSync.disabled = true;
        btnManualSync.textContent = "Syncing...";
        chrome.runtime.sendMessage({ type: "REFRESH_PROGRESS" }, (res) => {
            setTimeout(() => {
                btnManualSync.disabled = false;
                btnManualSync.textContent = "Sync Now ↻";
                loadStatus();
            }, 300);
        });
    });

    // Initial load: load status and if activePlaylist is missing, proactively trigger a refresh to scan tabs
    loadStatus((res) => {
        if (!res?.activePlaylist?.playlistId) {
            chrome.runtime.sendMessage({ type: "REFRESH_PROGRESS" }, () => {
                loadStatus();
            });
        }
    });
});
