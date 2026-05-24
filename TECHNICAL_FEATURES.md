# Technical Features

This document describes the application from a developer's point of view: architecture, data flow, and implementation details.

## Core architecture

- Built with Next.js App Router and TypeScript.
- Uses server components for initial playlist analysis and metadata generation.
- Uses client components for interactive tracking, optimistic updates, and auth-aware UI.
- Styled with Tailwind CSS and shadcn/ui primitives.

## Playlist analysis pipeline

- Accepts a YouTube playlist link or playlist ID.
- Resolves playlist metadata and video details from the YouTube Data API.
- Computes total duration, remaining time, and speed-adjusted estimates.
- Generates route metadata dynamically for playlist pages.

## Progress model

- Uses a unified status model: `DONE`, `SKIP`, `REWATCH`, and `NONE`.
- Stores progress locally for guests.
- Syncs progress to Supabase Postgres for authenticated users.
- Persists `updatedAt` alongside each progress record.
- Supports optimistic UI updates with local fallback caching.

## Persistence and sync

- Saves playlists for signed-in users when they open a playlist.
- Stores playlist history in the database for sidebar display.
- Uses API routes for playlist save, progress read/write, and analysis.
- Merges server state and cached local state to reduce data loss.

## Authentication and account flow

- Uses Supabase Auth for sign up, sign in, password recovery, and password reset.
- Exchanges recovery and login codes through `/auth/callback`.
- Uses a site origin environment value for password reset redirects.

## Admin and access control

- Exposes an `/admin` dashboard.
- Admin access can be granted by configured admin email addresses or an `admin` role.
- Admin data queries require privileged Supabase access.

## Offline and shell support

- Includes a service worker in `public/sw.js`.
- Precaches the app shell and core assets.
- Falls back to `/offline.html` when navigation requests fail.
- Ships as a PWA-style app with a web manifest and app icons.

## Key implementation areas

- Playlist logic: `src/lib/youtube`
- Progress logic: `src/lib/progress` and `src/lib/storage/progress`
- Supabase helpers: `src/lib/supabase`
- Admin helpers: `src/lib/admin`
- API routes: `src/app/api`
- UI surfaces: `src/components`
