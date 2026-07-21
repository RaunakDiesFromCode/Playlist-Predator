# Project Instructions

## Project Overview

Playlist Predator is a YouTube playlist analysis tool built with Next.js App Router. It helps users track their learning progress through YouTube playlists with AI-powered insights via PredAI.

### Tech Stack

- **Framework**: Next.js 14+ with App Router, TypeScript
- **Database/Auth**: Supabase (playlists, playlist_progress, predai_conversations, predai_messages tables)
- **UI**: shadcn/ui with "new-york" style, neutral base color
- **APIs**: YouTube Data API (playlist analysis), OpenRouter API (PredAI chat)
- **Storage**: localStorage for local-first progress, synced to Supabase for authenticated users

### Key Routes

- `/` - Home/dashboard
- `/[playlistId]` - Playlist analysis view
- `/compare` - Playlist comparison (2-4 playlists)
- `/insights` - User learning insights
- `/admin` - Admin dashboard (requires admin role)
- `/login`, `/register`, `/forgot-password`, `/reset-password` - Auth flows

## Architecture

### File Organization

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - React components (ui/, playlist/, comparison/, insights/, predai/, sidebar/)
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities, API clients, database helpers
- `src/types/` - TypeScript type definitions

### API Routes

- `/api/playlist` - Playlist analysis (YouTube Data API)
- `/api/playlists` - CRUD for user playlists
- `/api/progress` - Progress tracking
- `/api/comparison` - Playlist comparison
- `/api/predai` - AI chat functionality (OpenRouter)
- `/api/admin` - Admin endpoints (requires service role key)

### Data Flow

1. User submits YouTube playlist/video URL
2. Server fetches metadata via YouTube Data API
3. Playlist stored in Supabase with user association
4. Progress tracked locally (localStorage) and synced to Supabase
5. PredAI provides chat insights using OpenRouter

## Development Guidelines

### General Principles

- Prefer modifying existing code over creating new files
- Keep file count low
- Remove dead code when encountered
- Inline single-use presentational components
- Delete obsolete components after refactoring
- Avoid unnecessary abstractions
- Validate code with `npm run lint` before committing

### Shell Commands

- Routes with brackets like `[playlistId]` must be quoted in zsh: `npm run dev "src/app/[playlistId]/"`
- Admin dashboard requires `SUPABASE_SERVICE_ROLE_KEY` for data queries

## Components

Create a new component only if:

- It is reused in multiple locations
- It contains meaningful business logic
- It manages its own state
- It represents a reusable feature
- It significantly improves maintainability

Do NOT create wrapper components around shadcn/ui primitives such as:

- comparison-card, stats-card, feature-card, dashboard-card
- section-header, metric-card
- Any component that simply wraps a single shadcn component

### When to Inline

Inline components into parent page/feature files when:

- Used in only one place
- Contains little/no business logic
- No meaningful state management
- Creates unnecessary file/import overhead

### Component Locations

- shadcn/ui primitives: `src/components/ui/`
- Playlist features: `src/components/playlist/`
- Comparison features: `src/components/comparison/`
- Insights features: `src/components/insights/`
- AI chat: `src/components/predai/`
- Layout: `src/components/layout/`

## shadcn/ui First

Before creating any file in `components/`:

1. Use an existing shadcn/ui component
2. Install a missing shadcn/ui component: `npx shadcn@latest add [component]`
3. Compose multiple shadcn/ui components
4. Create a custom component only if necessary

Custom components should be the exception, not the default.

## UI Guidelines

### Do

- Use shadcn/ui components directly
- Preserve existing layouts unless explicitly instructed
- Do not redesign working screens while implementing features
- Maintain visual consistency with the rest of the application
- Use direct composition of shadcn/ui primitives

### Don't

- Add decorative gradients, glassmorphism, glow effects
- Create decorative animations
- Add unnecessary visual flourishes
- Implement vibrant overlay/theme customization (removed in favor of standard shadcn tokens)

## Styling

Use standard shadcn/ui styling with:

- Simple layouts
- Borders
- Spacing
- Typography
- Standard component surfaces (light/dark theme tokens)

Avoid:

- Gradients
- Glassmorphism/backdrop blur
- Glow effects
- Decorative animations
- Custom visual systems

## Feature Development

### Playlist Analysis

- Accepts both playlist URLs and single video links
- Single videos are converted to chapter rows from description timestamps
- Chapter rows use timestamped watch URLs

### Progress Tracking

- Local-first with localStorage
- Syncs to Supabase for authenticated users
- Progress API includes `updatedAt` mapped from `playlist_progress.updated_at`

### Sidebar

- Uses shadcn Sidebar primitives with `collapsible="icon"`
- Width: `--sidebar-width: 260px`, icon width: `--sidebar-width-icon: 60px`
- Shared optimistic cache for playlists
- New entries upserted immediately and merged with API responses

### Export

- Playlist progress exports in `src/lib/export/`
- JSON/CSV serializers built from playlist metadata, videos, and progress state

### Comparison

- Lives at `/compare`
- Accepts 2-4 playlist URLs or IDs
- Surfaces per-item errors instead of failing the whole comparison

### Auth Flow

- Password reset: `/forgot-password` sends email, `/reset-password` exchanges recovery code

## Priorities

1. **Correctness** - Code must work correctly
2. **Maintainability** - Easy to understand and modify
3. **Simplicity** - Prefer simple solutions
4. **Consistency** - Follow existing patterns
5. **Visual polish** - Only after the above are satisfied

## Refactoring Rules

- Remove dead code when encountered
- Delete obsolete components after refactoring
- Avoid unnecessary abstractions
- Keep file count low
- Don't create wrapper components around primitives
