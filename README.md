# 🐺 Playlist Predator
>
> **Turn YouTube playlists into something you can actually *conquer*.**

[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/RaunakDiesFromCode/Playlist-Predator)

Playlist Predator is a modern web app that takes chaotic YouTube playlists and turns them into a clean, trackable, no-BS study / watch system. It tells you **how long the playlist really is**, how long it’ll take at different speeds, and lets you track exactly what you’ve **done**, **skipped**, or need to **rewatch**.

It works perfectly **without login** using local storage — and gets supercharged when you sign in, syncing everything to the cloud.

Live on Vercel. Fast. Snappy. Opinionated.

---

## ✨ Features

* 🎯 **Playlist analysis**
  Total duration, remaining time, and speed-based estimates (upto 4x).

* ✅ **Smart progress tracking**
  Mark videos as **Done**, **Skip**, or reset them back to **Study** (rewatch).

* ⚡ **Instant UI (optimistic updates)**
  Clicks feel immediate — no waiting on the network.

* 👤 **Optional authentication** (Supabase)

  * Guests → progress stored locally
  * Logged-in users → progress stored in Postgres

* 🧠 **Unified progress model**
  No fake states. No duplicated data. Clean semantics.

* 📚 **Playlist sidebar**
  Logged-in users get a sidebar showing every playlist they’ve ever opened.

* 🌙 **Dark mode** out of the box

---

## 🛠 Tech Stack

# 🐺 Playlist Predator

> Turn YouTube playlists into something you can actually conquer.

Playlist Predator converts messy YouTube playlists into a tidy, trackable study/watch system. It calculates total and remaining durations, gives speed-adjusted time estimates, and helps you track what you've watched, skipped, or want to rewatch.

Works well for guests using local storage and upgrades to cloud sync when you sign in with Supabase.

Live on Vercel — fast, snappy, and opinionated.

---

## ✨ Key Features

* 🎯 Playlist analysis — total videos, total duration, and remaining time.
* ⏱ Speed estimates — see how long a playlist takes at 1x, 1.5x, 2x, and 4x playback speeds.
* ✅ Progress tracking — mark videos as `DONE`, `SKIP`, or clear them back to study state.
* 🔁 Local-first with sync — guests use localStorage; authenticated users sync progress to Postgres (Supabase).
* ⚡ Optimistic UI — instant feedback on interactions, with resilient local caching.
* 💾 Playlist save — logged-in users automatically save playlists they open (title + thumbnail).
* 🗂 Unified progress model — single source of truth; simple semantics (DONE / SKIP / none).
* 📚 Playlist sidebar — quick access to playlists you've opened when signed in.
* 🌙 Dark mode — built-in theme support.
* 🔒 Privacy-focused — no tracking, no ads, just your playlists.

---

## 🛠 Tech Stack

* Next.js (App Router)
* TypeScript
* Tailwind CSS + shadcn/ui components
* Supabase (Auth + Postgres) for optional sync
* YouTube Data API for playlist & video metadata
* Vercel for deployment

---

## ⚙️ How It Works (High level)

* Playlist analysis: server route fetches playlist items and video details from the YouTube API, computes durations and formatted times.
* Progress: localStorage for guests; logged-in users read merged progress from the DB and local cache. Writes are sent to `/api/progress` and also cached locally for resiliency.
* Playlist persistence: when a logged-in user opens a playlist it is recorded in the `playlists` table via `/api/playlists`.

---

## 📡 API Endpoints (important ones)

* `POST /api/playlist/analyze` — Accepts `{ playlistUrl, completedVideos? }` and returns playlist summary and video list.
* `GET /api/playlists` — Returns playlists saved for the signed-in user.
* `POST /api/playlists` — Save a playlist for the user (youtube id + title + thumbnail).
* `GET /api/progress?playlistId=...` — Fetches saved progress for authenticated user (guest clients fall back to localStorage).
* `PATCH /api/progress` — Upsert a single video's status for the current user.

Refer to the `src/app/api` folder for implementations.

---

## 🚀 Getting Started (Local development)

Install and run:

```bash
npm install
npm run dev
```

Create a `.env.local` with the following variables (examples):

```env
YOUTUBE_API_KEY=your_youtube_api_key
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXTAUTH_SECRET=some_strong_secret
VERCEL_URL=http://localhost:3000
```

Environment notes:
* `YOUTUBE_API_KEY` is required for server-side playlist analysis.
* Supabase keys are only needed if you want authentication + sync.

---

## 🧪 Development notes

* Playlist analysis lives under `src/lib/youtube` (`client.ts`, `playlist.ts`).
* Progress merging and persistence live under `src/lib/progress` and `src/lib/storage/progress`.
* Supabase server/client helpers are in `src/lib/supabase`.
* Key API routes: `src/app/api/playlist/analyze/route.ts`, `src/app/api/playlists/route.ts`, `src/app/api/progress/route.ts`.

If you add or change environment variables, restart the dev server.

---

## 🧩 Usage

1. Paste a YouTube playlist link or ID on the homepage.
2. The app will analyze the playlist and show total duration, per-video durations, and adjusted time estimates.
3. Toggle video statuses to track progress. If signed in, your choices sync to your account.

---

## Contributing

Contributions welcome. Feel free to open issues or PRs for bugs, improvements, or features. Keep changes focused and add tests where appropriate.

---

## License

Licensed under the MIT License. See `LICENSE`.

---

Cloned from Aymaan Shabbir's [Playlist Predator](https://github.com/Aymaan-Shabbir/Playlist-Predator)

Special thanks to [Dipannita Sharma](https://github.com/dipannitasharma)
