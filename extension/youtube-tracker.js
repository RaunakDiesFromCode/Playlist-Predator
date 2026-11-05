/**
 * Playlist Predator - YouTube Content Script
 * Tracks video playback on YouTube and syncs with the currently active playlist in Playlist Predator.
 */

(function () {
    console.log("[Predator Ext] YouTube tracker initialized");

    let currentVideoId = null;
    let currentPlaylistId = null;
    let trackedElement = null;
    let hasMarkedDone = false;
    let syncThreshold = 0.85; // 85% completion
    let pollInterval = null;

    // In-page toast notification on YouTube
    function showNotification(message, type = "success") {
        try {
            const existing = document.getElementById("predator-toast");
            if (existing) existing.remove();

            const toast = document.createElement("div");
            toast.id = "predator-toast";
            toast.className = `predator-toast predator-toast-${type}`;

            let icon = "✓";
            if (type === "info") icon = "ℹ";
            if (type === "error") icon = "✕";

            toast.innerHTML = `
                <div class="predator-toast-icon">${icon}</div>
                <div class="predator-toast-content">
                    <div class="predator-toast-title">Playlist Predator</div>
                    <div class="predator-toast-message">${message}</div>
                </div>
            `;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.classList.add("predator-toast-visible");
            }, 50);

            setTimeout(() => {
                toast.classList.remove("predator-toast-visible");
                setTimeout(() => toast.remove(), 400);
            }, 4500);
        } catch (e) {
            console.error("[Predator Ext] Error showing notification:", e);
        }
    }

    // Parse YouTube URL params
    function parseYouTubeUrl() {
        if (!window.location.pathname.startsWith("/watch")) {
            return { videoId: null, playlistId: null };
        }
        const params = new URLSearchParams(window.location.search);
        return {
            videoId: params.get("v"),
            playlistId: params.get("list"),
        };
    }

    // Get current playback stats (handles both <video> element and YouTube movie_player API)
    function getPlaybackStats(videoEl) {
        let currentTime = videoEl?.currentTime || 0;
        let duration = videoEl?.duration || 0;
        let isEnded = videoEl?.ended || false;

        const moviePlayer = document.getElementById("movie_player");
        if ((!duration || duration <= 0) && moviePlayer?.getDuration) {
            try {
                duration = moviePlayer.getDuration();
                currentTime = moviePlayer.getCurrentTime();
                isEnded = moviePlayer.getPlayerState?.() === 0;
            } catch {}
        }

        return { currentTime, duration, isEnded };
    }

    // Check if progress threshold reached
    function checkCompletion(videoEl, activePlaylistId, videoId) {
        if (hasMarkedDone) return;

        const { currentTime, duration, isEnded } = getPlaybackStats(videoEl);
        if (!duration || duration <= 0) return;

        const ratio = currentTime / duration;

        // If watched or scrubbed past 85% or reached end
        if (ratio >= syncThreshold || isEnded) {
            hasMarkedDone = true;
            triggerMarkDone(activePlaylistId, videoId);
        }
    }

    // Trigger completion to background worker
    function triggerMarkDone(playlistId, videoId) {
        console.log(`[Predator Ext] Triggering mark done for video ${videoId} in playlist ${playlistId}`);

        chrome.runtime.sendMessage(
            {
                type: "MARK_VIDEO_DONE",
                payload: { playlistId, videoId },
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("[Predator Ext] Message error:", chrome.runtime.lastError);
                    hasMarkedDone = false; // Allow retry on error
                    showNotification("Could not communicate with extension", "error");
                    return;
                }

                if (response?.updated) {
                    showNotification("Video marked as Done! Synced with Predator.", "success");
                } else if (response?.unchanged) {
                    showNotification(`Video is already ${response.currentStatus || "DONE"} in Predator.`, "info");
                } else if (response?.error) {
                    hasMarkedDone = false; // Allow retry on error
                    showNotification(`Sync notice: ${response.message || response.error}`, "error");
                }
            }
        );
    }

    // Attach listeners to HTML5 video element
    function attachVideoListeners(videoEl, activePlaylistId, videoId) {
        if (!videoEl) return;
        trackedElement = videoEl;

        const onEvent = () => checkCompletion(videoEl, activePlaylistId, videoId);

        // Listen to playback and scrubbing events
        videoEl.addEventListener("timeupdate", onEvent);
        videoEl.addEventListener("seeked", onEvent);
        videoEl.addEventListener("pause", onEvent);
        videoEl.addEventListener("ended", onEvent);

        // Immediate check in case user is already past threshold
        onEvent();

        // Also poll every 600ms as a safety net for scrubbing while paused
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(onEvent, 600);
    }

    // Check if the current YouTube video should be tracked
    async function evaluateCurrentVideo() {
        const { videoId, playlistId } = parseYouTubeUrl();

        if (!videoId) {
            currentVideoId = null;
            currentPlaylistId = null;
            trackedElement = null;
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
            return;
        }

        // Reset if video changed
        if (videoId !== currentVideoId) {
            currentVideoId = videoId;
            currentPlaylistId = playlistId;
            hasMarkedDone = false;
            trackedElement = null;
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
        } else if (trackedElement) {
            return;
        }

        // Query background worker for Predator state
        chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
            if (chrome.runtime.lastError || !response?.success) {
                return;
            }

            const { auth, activePlaylist, progress } = response;

            // 1. Must be logged in to Predator
            if (!auth?.authenticated) {
                console.log("[Predator Ext] User is not logged in to Playlist Predator. Tracking disabled.");
                return;
            }

            // 2. Must have active playlist
            if (!activePlaylist?.playlistId) {
                console.log("[Predator Ext] No active playlist open in Playlist Predator. Tracking disabled.");
                return;
            }

            const activeId = activePlaylist.playlistId;
            const belongsToActivePlaylist =
                (playlistId && playlistId === activeId) ||
                (Array.isArray(activePlaylist.videoIds) && activePlaylist.videoIds.includes(videoId));

            if (!belongsToActivePlaylist) {
                console.log(`[Predator Ext] Video ${videoId} does not belong to active playlist '${activePlaylist.title}' (${activeId}). Ignoring.`);
                return;
            }

            // 3. Do not overwrite if already completed/skipped
            const existingStatus = progress?.[videoId]?.status;
            if (existingStatus && existingStatus !== "NONE") {
                console.log(`[Predator Ext] Video ${videoId} has status '${existingStatus}' in Predator. Preserving state.`);
                // Still attach so if user scrubs, they see the info notification that it's already done
            }

            console.log(`[Predator Ext] 🎯 Tracking video ${videoId} for playlist '${activePlaylist.title}' (${activeId})`);

            // Find video element
            const findAndAttach = () => {
                const videoEl = document.querySelector("video");
                if (videoEl) {
                    attachVideoListeners(videoEl, activeId, videoId);
                } else {
                    setTimeout(findAndAttach, 300);
                }
            };

            findAndAttach();
        });
    }

    // YouTube SPA navigation listeners
    window.addEventListener("yt-navigate-finish", () => {
        setTimeout(evaluateCurrentVideo, 250);
    });

    window.addEventListener("popstate", () => {
        setTimeout(evaluateCurrentVideo, 250);
    });

    // Initial check
    setTimeout(evaluateCurrentVideo, 500);
})();
