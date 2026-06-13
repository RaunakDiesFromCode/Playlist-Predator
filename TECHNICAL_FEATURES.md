# Technical Features

This document describes the application from a developer's point of view: architecture, data flow, and implementation details.

## Core architecture

- Built with Next.js App Router and TypeScript.
- Uses server components for initial playlist analysis and metadata generation.
- Uses client components for interactive tracking, optimistic updates, and auth-aware UI.
- Styled with Tailwind CSS and shadcn/ui primitives.
- Toast notifications via Sonner.
- All API routes require authentication via Supabase `getUser()`.

## Playlist analysis pipeline

- Accepts a YouTube playlist link, playlist ID, or normal video link.
- Resolves playlist metadata and video details from the YouTube Data API.
- For single videos, extracts chapter timestamps from the description and converts them into chapter-style rows.
- Computes total duration, remaining time, and speed-adjusted estimates.
- Generates route metadata dynamically for playlist pages and video-derived study sets.

## Progress model

- Uses a unified status model: `DONE`, `SKIP`, `REWATCH`, and `NONE`.
- Validates status values at the API layer (`VALID_STATUSES` set).
- Stores progress locally for guests.
- Syncs progress to Supabase Postgres for authenticated users.
- Persists `updatedAt` alongside each progress record.
- Supports optimistic UI updates with local fallback caching.

## Persistence and sync

- Saves playlists for signed-in users when they open a playlist.
- Stores playlist history in the database for sidebar display.
- Upserts the currently opened playlist or video-derived study set into the sidebar cache immediately, then merges it with the server playlist list so it stays visible even if progress status changes.
- Uses API routes for playlist save, delete, progress read/write, and analysis.
- Merges server state and cached local state to reduce data loss.
- Playlist deletion removes both the playlist record and all associated `playlist_progress` rows, scoped to `user_id` for security. The sidebar in-memory cache is updated immediately via `removeSidebarPlaylist()` and a `sidebar:playlist-deleted` custom event, enabling cross-component sync without a full refresh. If the deleted playlist is the current route, the user is redirected to `/`.

## Authentication and account flow

- Uses Supabase Auth for sign up, sign in, password recovery, and password reset.
- Exchanges recovery and login codes through `/auth/callback`.
- Uses a site origin environment value for password reset redirects.

## Admin and access control

- Exposes an `/admin` dashboard.
- Admin access can be granted by configured admin email addresses or an `admin` role.
- Admin data queries require privileged Supabase access (service role key).

## PredAI — Playlist-aware study assistant

- AI chat powered by OpenRouter with configurable model (`PREDAI_MODEL`).
- Builds server-side context from playlist metadata, progress, study plan, and video listing.
- Supports web search via Tavily for content-related questions (decided by `decideSearch()`).
- Streams responses via Server-Sent Events (SSE).
- Persists conversations and messages in Supabase tables (`predai_conversations`, `predai_messages`).
- Loads conversation history per playlist on mount.
- Markdown rendering with GFM support via `react-markdown` + `remark-gfm`.

## Learning insights

- `/insights` dashboard for authenticated users.
- Shows overview stats (playlists tracked, videos completed, completion rate, last activity).
- Progress breakdown by status per playlist.
- Playlist rankings by completion rate.
- Recent activity feed.
- Learning summary with recommended next steps.

## Search, filter, and sort

- Client-side search within playlist videos by serial number, title, or channel.
- Filter videos by status (All, Done, Rewatch, Skip, Study).
- Sort by default order, alphabetically (A-Z, Z-A), or by duration (shortest/longest).
- 56-day activity completion heatmap in the overview section.

## Offline and shell support

- Includes a service worker in `public/sw.js`.
- Precaches the app shell and core assets.
- Falls back to `/offline.html` when navigation requests fail.
- Ships as a PWA-style app with a web manifest and app icons.

## Export

- Copy playlist progress as JSON or CSV to the clipboard from the playlist overview.
- Includes metadata, counts, and per-video status/duration.

## Key implementation areas

- Playlist logic: `src/lib/youtube`
- YouTube input parsing and chapter extraction: `src/lib/youtube/input.ts` and `src/lib/youtube/chapters.ts`
- Progress logic: `src/lib/progress` and `src/lib/storage/progress`
- Sidebar playlist cache (CRUD + custom events): `src/lib/sidebar/playlists.ts`
- Playlist DB operations (create, read, delete): `src/lib/db/playlists.ts`
- Supabase helpers: `src/lib/supabase`
- Admin helpers: `src/lib/admin`
- PredAI (context, search, DB, prompts): `src/lib/predai`
- Insights calculations: `src/lib/insights`
- API routes: `src/app/api`
- UI surfaces: `src/components`
- shadcn/ui primitives: `src/components/ui` (alert-dialog, badge, button, card, drawer, dropdown-menu, field, input, label, progress, scroll-area, select, separator, sheet, skeleton, table, textarea, tooltip)
