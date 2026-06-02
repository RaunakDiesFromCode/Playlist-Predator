# Project Guidelines

## Architecture

- Prefer modifying existing code over creating new files.
- Avoid creating wrapper components around shadcn/ui primitives.
- Inline single-use presentational components.
- Delete obsolete components after refactoring.
- Keep file count low.

## Components

- Create a component only if:
  - Used multiple times.
  - Contains meaningful logic.
  - Contains state management.
  - Represents a reusable feature.

- Do not create components such as:
  - comparison-card
  - stats-card
  - feature-card
  - section-header
  - dashboard-card

when they simply wrap existing shadcn/ui components.

## UI

- Use shadcn/ui components directly.
- Preserve existing layouts unless explicitly instructed otherwise.
- Avoid visual redesigns while implementing features.

## Styling

Avoid:
- Gradients
- Glassmorphism
- Glow effects
- Decorative animations
- Custom visual systems

Prefer:
- border
- rounded-lg
- space-y-*
- flex
- grid
- text-muted-foreground

## Refactoring

When touching existing code:
- Remove dead code.
- Remove single-use wrapper components.
- Consolidate duplicate implementations.
- Simplify abstractions where possible.

## Development Philosophy

Prioritize:
1. Correctness
2. Maintainability
3. Simplicity
4. Consistency
5. Visual polish

Functionality is more important than aesthetics.

## shadcn/ui First Policy

Before creating any file in `components/`, determine whether the requirement can be fulfilled using an existing shadcn/ui component.

Decision order:

1. Use an existing shadcn/ui component already present in the project.
2. Install the missing shadcn/ui component using the shadcn CLI.
3. Compose multiple shadcn/ui components together.
4. Create a custom component only when shadcn/ui cannot reasonably solve the problem.

Custom components should be the exception, not the default solution.

Do not create wrapper components around shadcn/ui primitives unless they:

* Are reused in multiple places.
* Contain meaningful business logic.
* Contain state management.
* Represent a distinct reusable feature.

When a custom component duplicates existing shadcn/ui functionality, prefer replacing it with the appropriate shadcn/ui component and removing the duplicate implementation.

Always prefer the simplest solution with the fewest files and the least abstraction.
