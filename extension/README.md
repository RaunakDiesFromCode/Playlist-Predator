# Playlist Predator — Chrome Extension (YouTube Auto-Sync)

Automatically syncs your YouTube watch progress directly to your active playlist in [Playlist Predator](https://playlist-predator.vercel.app/).

---

## Key Features

1. **Effortless Auto-Done Tracking**:
   * When you watch a video on YouTube past **85% completion** (or when the video finishes), it is automatically marked as **DONE** in Playlist Predator.
   * Shows a sleek, unobtrusive notification on YouTube: `✓ Video marked as Done! Synced with Predator`.
2. **Preserves Existing Progress (No accidental downgrades)**:
   * Only transitions videos from `STUDY` / `NONE` to `DONE`.
   * Videos already marked as `DONE`, `REWATCH`, or `SKIP` in Playlist Predator are **never altered or downgraded**.
3. **Active Playlist Isolation**:
   * The extension strictly tracks **only the playlist you are currently on in Playlist Predator**.
   * Watching unrelated YouTube videos will not pollute or alter any of your playlists.
4. **No YouTube Login Required**:
   * Works on any YouTube tab regardless of whether you are signed into YouTube.
   * You only need to be signed into **Playlist Predator**.
5. **Open in Predator Button**:
   * Quickly jump to your active study playlist on Playlist Predator directly from the extension popup.
6. **Live Sync with Predator App**:
   * When a video is marked done on YouTube, any open Playlist Predator tabs are notified to refresh their progress.
   * A dedicated **Refresh / Sync** button is also available directly inside Playlist Predator.

---

## How to Install in Chrome

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. In the top-right corner, toggle **Developer mode** to **ON**.
4. Click **Load unpacked** in the top-left corner.
5. Select the `extension/` folder in this repository:
   ```
   /Users/raunakmanna/Documents/Programming/NextJS/Playlist-Predator/extension
   ```
6. The **Playlist Predator - YouTube Sync** extension is now installed! Pin it to your Chrome toolbar for easy access.

---

## How It Works

```
┌─────────────────────────────────┐
│ 1. Open Playlist Predator       │
│    - Sign in to your account    │
│    - Open your study playlist   │
└────────────────┬────────────────┘
                 │ (Automatically registers as active playlist)
                 ▼
┌─────────────────────────────────┐
│ 2. Watch on YouTube             │
│    - Open the playlist / video  │
│    - When you pass 85% watched  │
└────────────────┬────────────────┘
                 │ (Direct API call to Predator)
                 ▼
┌─────────────────────────────────┐
│ 3. Auto-Synced!                 │
│    - Video updated to DONE      │
│    - Predator tab refreshes     │
└─────────────────────────────────┘
```

---

## Troubleshooting

- **"Not Logged In" in popup:**
  * Open Playlist Predator and log in. The extension will automatically detect your session.
- **"No active playlist" in popup:**
  * Open any playlist page in Playlist Predator (e.g. `https://predator.raunakm.xyz/PL...`). The extension bridge automatically links it.
