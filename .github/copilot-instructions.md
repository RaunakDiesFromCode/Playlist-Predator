# Project Instructions

## Architecture

* Prefer modifying existing code over creating new files.
* Keep file count low.
* Remove dead code when encountered.
* Inline single-use presentational components.
* Delete obsolete components after refactoring.
* Avoid unnecessary abstractions.

## Components

Create a new component only if:

* It is reused in multiple locations.
* It contains meaningful business logic.
* It manages its own state.
* It represents a reusable feature.
* It significantly improves maintainability.

Do not create wrapper components around shadcn/ui primitives.

Avoid components such as:

* comparison-card
* stats-card
* feature-card
* dashboard-card
* section-header
* metric-card

when they simply wrap existing shadcn/ui components.

## shadcn/ui First

Before creating any file in `components/`:

1. Use an existing shadcn/ui component.
2. Install a missing shadcn/ui component.
3. Compose multiple shadcn/ui components.
4. Create a custom component only if necessary.

Custom components should be the exception, not the default.

## UI

* Use shadcn/ui components directly.
* Preserve existing layouts unless explicitly instructed otherwise.
* Do not redesign working screens while implementing features.
* Maintain visual consistency with the rest of the application.

## Styling

Avoid:

* Gradients
* Glassmorphism
* Glow effects
* Decorative animations
* Unnecessary visual flourishes

Prefer:

* Simple layouts
* Borders
* Spacing
* Typography
* Standard shadcn/ui styling

## Priorities

1. Correctness
2. Maintainability
3. Simplicity
4. Consistency
5. Visual polish
