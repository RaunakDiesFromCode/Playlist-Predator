# 🐺 Playlist Predator

> **Turn YouTube playlists into something you can actually *conquer*.**

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

* **Next.js (App Router)**
* **TypeScript**
* **Tailwind CSS + shadcn/ui**
* **Supabase** (Auth + Postgres)
* **YouTube Data API**
* **Vercel** (hosting)

---

## 🧩 How Progress Works (Important)

Playlist Predator uses a deliberately simple model:

* `DONE` → video watched
* `SKIP` → video skipped
* *(no entry)* → video still in study / rewatch mode

There is **no stored “rewatch” state** — rewatch is an *action*, not a state.

This keeps counts accurate, logic predictable, and data clean.

---

## 🚀 Getting Started (Local)

```bash
npm install
npm run dev
```

Create a `.env.local` with:

```env
YOUTUBE_API_KEY = ...
NEXTAUTH_SECRET= ...
NEXTAUTH_URL= ...
NEXT_PUBLIC_SUPABASE_URL= ...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY= ...
NEXT_PUBLIC_SUPABASE_ANON_KEY= ...
```

---

## 🧪 Status

This project is actively developed and already production-ready.
Expect polish, refinements, and more predator instincts.

---

## 📄 License

Licensed under the MIT License. See `LICENSE` for details.

---

## 🐾 Why “Playlist Predator”?

Because playlists shouldn’t hunt *you*.

You hunt **them**.

---

### 😴 Things I want to add someday

* Responsive mobile layout
* AI-powered playlist summarization
* Browser extension for quick playlist importing

---

# Cloned from Aymaan Shabbir's [Playlist Predator](https://github.com/Aymaan-Shabbir/Playlist-Predator)

# Special thanks to [Dipannita Sharma](https://github.com/dipannitasharma)
