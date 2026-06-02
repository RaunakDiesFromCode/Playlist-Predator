# AGENTS.md

## Overview

This project follows a simplicity-first architecture.

The goal is to build maintainable features using existing shadcn/ui components and minimal abstraction.

Favor straightforward implementations over clever abstractions.

---

# Development Philosophy

Priorities:

1. Correctness
2. Maintainability
3. Simplicity
4. Consistency
5. Visual polish

Do not introduce complexity unless it solves a real problem.

---

# File Creation Policy

Before creating a file:

* Determine whether existing code can be extended.
* Determine whether an existing component can be reused.
* Determine whether shadcn/ui already provides the required functionality.

Prefer editing existing files.

Keep the number of files as low as reasonably possible.

---

# Component Policy

## Keep Inline When

Keep UI directly in the page or feature component when:

* Used once
* Small in size
* Primarily presentational
* Contains little or no logic
* Exists only for styling purposes

Example:

Good:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Statistics</CardTitle>
  </CardHeader>
</Card>
```

Bad:

```tsx
<StatisticsCard />
```

when used only once.

---

## Create a Component When

Create a component only if:

* Reused in multiple places
* Contains business logic
* Contains state management
* Contains complex interactions
* Represents a reusable feature

Examples:

* PlaylistComparison
* VideoProgressTracker
* UserProfileForm
* SearchFilters
* ThemeToggle

---

# shadcn/ui First Policy

Always check whether shadcn/ui already solves the requirement.

Decision order:

1. Use an existing shadcn/ui component.
2. Install a missing shadcn/ui component.
3. Compose existing shadcn/ui components.
4. Build a custom component only if necessary.

Custom UI implementations should be rare.

---

# Installing shadcn/ui Components

If a required component does not exist:

Check:

```bash
ls components/ui
```

Install:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add accordion
npx shadcn@latest add dropdown-menu
npx shadcn@latest add command
npx shadcn@latest add form
npx shadcn@latest add calendar
```

Use generated components directly.

Avoid creating wrapper components around installed shadcn/ui primitives.

---

# Refactoring Rules

When touching existing code:

* Remove dead code.
* Remove obsolete files.
* Remove single-use wrappers.
* Consolidate duplicate implementations.
* Simplify abstractions.
* Reduce unnecessary imports.

If a component only wraps a shadcn Card, Dialog, Badge, Table, or Button and is used once, consider inlining it.

---

# UI Guidelines

This is not a marketing website.

Functionality takes priority over visual experimentation.

Preserve existing layouts whenever possible.

Do not redesign screens unless explicitly requested.

---

# Styling Guidelines

Prefer:

* border
* rounded-lg
* space-y-*
* gap-*
* flex
* grid
* text-muted-foreground

Avoid:

* bg-gradient-*
* text-transparent bg-clip-text
* backdrop-blur
* glassmorphism
* excessive shadows
* floating decorative elements
* custom visual systems

Use default shadcn/ui styling whenever possible.

---

# Feature Development

When implementing a feature:

1. Make it work.
2. Integrate with existing patterns.
3. Use shadcn/ui components.
4. Keep implementation simple.
5. Refactor only when beneficial.

Do not perform unrelated visual redesigns.

Do not create files merely for organizational aesthetics.

Favor maintainability and simplicity over abstraction.
