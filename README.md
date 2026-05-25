# 🐺 Playlist Predator

> Turn YouTube playlists into something you can actually conquer.

[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/RaunakDiesFromCode/Playlist-Predator)

Playlist Predator converts messy YouTube playlists into a clean study and watch system. It shows how long a playlist really is, how long it will take at different playback speeds, and helps you track what you have done, skipped, or want to rewatch.

It works without login using local storage, and upgrades to Supabase sync when you sign in. The app also includes a saved-playlists sidebar, password reset flows, an admin dashboard, and offline support via a service worker.

![Playlist Predator preview](public/preview.png)
 <sup>(Playlist: [Binary Search Beginner to Advanced | C++, Java, Python | Notes + Contest](https://www.youtube.com/playlist?list=PLgUwDviBIf0pMFMWuuvDNMAkoQFi-h0ZF))</sup>

---

## ✨ Features

* 🎯 Playlist analysis
  Total videos, total duration, remaining time, and speed-based estimates.

* ✅ Progress tracking
  Mark videos as `DONE`, `SKIP`, `REWATCH`, or clear them back to `NONE`.

* ⚡ Optimistic updates
  Progress changes feel instant, with local caching for resilience.

* 👤 Local-first auth flow
  Guests keep progress in local storage; signed-in users sync through Supabase.

* 💾 Saved playlists
  Logged-in users automatically save playlists they open, including title and thumbnail.

* 📚 Playlist sidebar
  Quick access to saved playlists, with search and loading states.

* 🔒 Account recovery
  Login, register, forgot-password, and reset-password flows are built in.

* 🛡 Admin dashboard
  `/admin` is available for configured admin emails or users with the `admin` role.

* 📶 Offline support
  The app ships with a service worker, precached assets, and an offline fallback page.

* 🌙 Dark mode
  Uses the standard light/dark theme tokens from the app shell.

---

## 🛠 Tech Stack

* Next.js App Router
* TypeScript
* Tailwind CSS + shadcn/ui
* Supabase for auth and Postgres-backed sync
* YouTube Data API for playlist and video metadata
* Vercel for deployment and analytics

---

## ⚙️ How It Works

* Playlist analysis happens on the server in `src/app/[playlistId]/page.tsx`, which fetches playlist metadata and computes durations.
* Progress is local-first. Guests read and write to local storage, while signed-in users merge local state with server state from `/api/progress`.
* Saved playlists are written through `/api/playlists` when a signed-in user opens a playlist.
* Password reset uses Supabase email recovery, then returns through `/auth/callback` to `/reset-password`.
* The service worker in `public/sw.js` precaches the app shell and serves `/offline.html` when navigation requests fail.

---

## 📡 API Routes

* `POST /api/playlist/analyze` - Accepts `{ playlistUrl, completedVideos? }` and returns playlist metadata plus the analyzed video list.
* `GET /api/playlists` - Returns saved playlists for the signed-in user.
* `POST /api/playlists` - Saves a playlist for the current user.
* `GET /api/progress?playlistId=...` - Returns saved progress for the current user.
* `PATCH /api/progress` - Upserts a single video status.
* `GET /auth/callback` - Exchanges Supabase recovery or sign-in codes for a session.

---

## 🚀 Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Create a `.env.local` file with the variables you need:

```env
YOUTUBE_API_KEY=your_youtube_api_key
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=admin@example.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Notes:

* `YOUTUBE_API_KEY` is required for server-side playlist analysis.
* Supabase keys are required for auth and cloud sync.
* `NEXT_PUBLIC_SITE_URL` is used by the password reset flow.
* `ADMIN_EMAILS` or `NEXT_PUBLIC_ADMIN_EMAILS` enables admin access checks.
* `SUPABASE_SERVICE_ROLE_KEY` is only needed for the admin dashboard's privileged queries.

---

## 🧪 Development Notes

* Playlist analysis lives under `src/lib/youtube`.
* Progress merging and persistence live under `src/lib/progress` and `src/lib/storage/progress`.
* Supabase server/client helpers are in `src/lib/supabase`.
* Admin access checks are in `src/lib/admin/access.ts`.
* The main app routes are in `src/app`, including `/admin`, `/login`, `/register`, `/forgot-password`, and `/reset-password`.

If you change environment variables, restart the dev server.

---

## 🧩 Usage

1. Paste a YouTube playlist link or ID on the homepage.
2. The app analyzes the playlist and shows total duration, remaining time, and speed-adjusted estimates.
3. Mark videos as done, skipped, or rewatch as you move through the playlist.
4. Sign in if you want progress and saved playlists to sync across devices.

---

## Contributing

Contributions are welcome. Keep changes focused and add tests where appropriate.

---

## License

Licensed under the MIT License. See `LICENSE`.

---

*Cloned from Aymaan Shabbir's [Playlist Predator](https://github.com/Aymaan-Shabbir/Playlist-Predator)
Special thanks to [Dipannita Sharma](https://github.com/dipannitasharma)*
