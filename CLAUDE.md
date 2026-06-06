# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` — Start the Next.js dev server
- `npm run build` — Production build
- `npm run lint` — ESLint (next lint)
- `npm install` — Install dependencies

## Environment Variables

Required in `.env.local`:
- `YOUTUBE_API_KEY` — Server-side playlist analysis
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Auth and cloud sync
- `NEXT_PUBLIC_SITE_URL` — Password reset flow (http://localhost:3000 for dev)
- `ADMIN_EMAILS` or `NEXT_PUBLIC_ADMIN_EMAILS` — Admin access (comma-separated)
- `SUPABASE_SERVICE_ROLE_KEY` — Admin dashboard privileged queries only

## Architecture Overview

**Playlist Predator** is a Next.js App Router app that converts YouTube playlists and chaptered videos into a trackable study/watch system.

### Routing

- `/` — Home page with playlist/video URL input form (`HomeClient.tsx`)
- `/[playlistId]` — Playlist analysis and progress tracking page. The dynamic route param can be a playlist ID or video ID; the server tries playlist first, then falls back to video.
- `/compare` — Compare up to 4 playlists side-by-side
- `/stats` — User statistics dashboard
- `/admin` — Admin dashboard (restricted by email or `admin` role)
- `/login`, `/register`, `/forgot-password`, `/reset-password` — Auth flows

### Data Flow

1. **Playlist analysis** happens server-side in `src/app/[playlistId]/page.tsx` via `analyzePlaylist()` from `src/lib/youtube/playlist.ts`
2. **Single-video inputs** are parsed from YouTube URLs and chapter timestamps are extracted from descriptions via `src/lib/youtube/chapters.ts`
3. **Progress is local-first**: guests use localStorage (`src/lib/storage/progress.ts`); signed-in users sync via `/api/progress` which writes to Supabase `playlist_progress` table
4. **Progress merging** (`src/lib/progress/index.ts`): on load, remote (DB) and local (localStorage) progress are merged by `updatedAt` timestamp — newest wins
5. **Saved playlists** are written through `/api/playlists` when a signed-in user opens a playlist; the sidebar cache updates immediately via in-memory cache + custom events
6. **Playlist deletion** (`DELETE /api/playlists?youtubePlaylistId=...`): deletes the playlist record and all associated `playlist_progress` rows; the sidebar cache removes the entry via `removeSidebarPlaylist()` and dispatches a `sidebar:playlist-deleted` custom event for cross-component sync; redirects to `/` if the deleted playlist was active

### Key Libraries

- `src/lib/youtube/` — YouTube Data API client (`client.ts`), URL parsing (`input.ts`), playlist analysis (`playlist.ts`), chapter extraction (`chapters.ts`)
- `src/lib/progress/` — Client-side progress loading/merging (`index.ts`), server-side progress (`server.ts`)
- `src/lib/storage/progress.ts` — localStorage progress persistence
- `src/lib/supabase/` — Supabase browser client (`client.ts`) and server client factory (`server.ts`) using `@supabase/ssr`
- `src/lib/sidebar/playlists.ts` — In-memory sidebar playlist cache with custom event dispatch for cross-component sync; supports add, upsert, and remove operations
- `src/lib/comparison/` — Playlist comparison logic
- `src/lib/export/` — CSV/JSON export utilities
- `src/lib/planner/planner.ts` — Study planner calculations (days required, speed-adjusted time, completion date)
- `src/lib/playlist/resume.ts` — Resume-watching target logic (first-unfinished, first-skipped, first-rewatch, last-played, first-item)
- `src/lib/admin/` — Admin access checks (`access.ts`) and dashboard data (`dashboard.ts` using service role key)

### Auth

- `src/hooks/use-auth.ts` — React hook wrapping Supabase auth state; provides `{ user, loading }` with `AuthUser` type
- `src/app/auth/callback/route.ts` — Supabase OAuth/email callback handler, exchanges code for session
- Admin access: checked via `isAdminEmail()` (env-configured emails) or `isAdminRole()` (user metadata role = "admin")

### Component Organization

- `src/components/ui/` — shadcn/ui components (alert-dialog, button, card, dialog, drawer, dropdown-menu, input, label, progress, scroll-area, select, separator, sheet, skeleton, table, tooltip, badge, field)
- `src/components/playlist/` — Playlist page components (PlaylistForm, PlaylistOverview, PlaylistVideoList, PlaylistVideoCard, PlaylistAnalysisSkeleton, ResumeWatchingPanel)
- `src/components/sidebar/` — Sidebar, SidebarItem, SidebarSkeleton
- `src/components/layout/` — Navbar, Footer
- `src/components/auth/` — AuthCard
- `src/components/comparison/` — Comparison table and client component
- `src/components/theme-provider.tsx` + `ThemeToggle.tsx` — Dark/light mode via `next-themes`

### Styling

- Tailwind CSS with shadcn/ui "new-york" style, neutral base color, CSS variables enabled
- Global font: JetBrains Mono (via `next/font/google`)
- See AGENTS.md for detailed styling guidelines (no gradients, no glassmorphism, prefer `border`, `rounded-none`, `text-muted-foreground`)

### Service Worker

- Registered client-side in `Body.tsx` for production only
- `public/sw.js` precaches app shell, serves `/offline.html` on navigation failure
- Web manifest at `src/app/manifest.ts`

### Supabase Tables (inferred from code)

- `playlists` — `id, user_id, youtube_playlist_id, title, thumbnail, created_at, updated_at`
- `playlist_progress` — `id, user_id, playlist_id, video_id, status, updated_at` (unique on `user_id,playlist_id,video_id`)

## Development Philosophy

This project follows a simplicity-first architecture. See `AGENTS.md` for the full policy. Key points:

- Prefer editing existing files over creating new ones
- Use shadcn/ui components first; custom UI should be rare
- Keep components inline unless reused, contain business logic, or manage state
- Remove dead code and single-use wrappers when touching existing code
- Functionality over visual experimentation; preserve existing layouts
