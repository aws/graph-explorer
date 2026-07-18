# Design System

The visual design system for Graph Explorer. Read this before modifying UI styling, adding color tokens, or writing Tailwind classes in components.

## Color Architecture

### Palette → Semantic → Component

Colors flow in one direction:

1. **Palette scales** — raw oklch color ramps defined in `@theme` (e.g. `brand-50` through `brand-950`, `gray-50` through `gray-950`). These are the source values.
2. **Semantic tokens** — named roles that reference palette values (e.g. `--color-primary: var(--color-brand-500)`). Defined in `@theme` in `index.css`.
3. **Components** — use semantic tokens via Tailwind classes (`bg-primary`, `text-foreground`). Components should not reach for palette scales directly.

### The gray palette

The Tailwind neutral scales (`slate`, `zinc`, `neutral`, `stone`) are removed. `gray-*` is redefined with zinc's oklch values — a single neutral scale under a familiar name. When you write `bg-gray-100`, you get zinc-100. This is intentional and documented, not an accident.

### Semantic token vocabulary

**Base layer** — surface-agnostic defaults:

| Token              | Purpose                                     | Value     |
| ------------------ | ------------------------------------------- | --------- |
| `foreground`       | Default text color                          | gray-900  |
| `background`       | App background                              | white     |
| `background-alt`   | Alternate background (e.g. sidebar area)    | gray-50   |
| `workspace`        | Tinted workspace background panels float in | brand-100 |
| `workspace-canvas` | Graph/schema canvas surface                 | brand-50  |
| `muted`            | Muted/deemphasized surface                  | gray-100  |
| `muted-foreground` | Secondary/deemphasized text (any surface)   | gray-500  |
| `border`           | Default border color                        | gray-200  |
| `input-background` | Form input fill                             | white     |
| `input-border`     | Form input border                           | gray-300  |

**Role colors** — each role follows a consistent slot pattern:

| Slot             | Meaning                                       |
| ---------------- | --------------------------------------------- |
| `X`              | Solid surface fill (the role's primary color) |
| `X-hover`        | Solid surface fill on hover                   |
| `X-foreground`   | Role-colored text on a normal background      |
| `X-subtle`       | Tinted/light surface fill                     |
| `X-subtle-hover` | Tinted surface fill on hover                  |

Roles: `primary`, `danger`, `warning`, `success`, `neutral`.

### Using color in components

**Strong preference: use semantic tokens.** Write `bg-primary-subtle text-primary-foreground`, not `bg-brand-50 text-brand-700`.

**Palette scales are legal for genuine one-offs** — a decorative gradient, a unique illustration element — but if you find yourself reaching for a palette value in a reusable component, consider whether a new semantic token should exist instead.

**When neither fits:** If a component needs a color that isn't covered by existing semantic tokens and isn't a one-off, propose a new token. Add it to the `@theme` block in `index.css` with a comment explaining its role, and update this document.

**Sanctioned palette one-offs.** These direct palette usages are known and intentional; don't re-flag or "fix" them:

- `CollapsibleSidebar` tab buttons: `active:bg-brand-300`, `hover:data-[state=active]:bg-brand-400` — pressed/hover-on-active interaction shades that fall between the semantic slots.

### Text on colored surfaces

- On solid role surfaces (`bg-primary`, `bg-danger`): use `text-white`.
- On tinted role surfaces (`bg-primary-subtle`): use `text-primary-foreground`.
- On normal backgrounds (`bg-background`, `bg-background-alt`): use `text-foreground` for body text, `text-muted-foreground` for secondary text, `text-primary-foreground` for brand emphasis.

## Dark Mode

Dark mode is a planned future feature. The semantic token structure is designed to support it via CSS `light-dark()` on the token definitions — when dark mode arrives, components should not need `dark:` classes because the semantic tokens themselves will resolve to appropriate values per mode.

**Policy:** Do not add `dark:` variant classes.

## Tailwind Conventions

- Use **Tailwind v4 CSS syntax** — `@theme`, `@utility`, `@custom-variant` blocks in CSS.
- Prefer **data attributes** for conditional styles. Tailwind v4 provides two forms:
  - `data-open:` / `data-closed:` — shorthand variants (defined via `@custom-variant` in `index.css`) that match `[data-state="open"]` / `[data-state="closed"]`, the Radix convention. Note: this **redefines** Tailwind's native behavior, where a bare `data-open:` would match the presence of a `data-open` attribute. Also: `aria-invalid:` for form validation.
  - `data-[attr=value]:` — arbitrary-value form for one-off attributes.
- Prefer **Tailwind responsive directives and container queries** over `ResizeObserver` for responsive layout changes.
- Reference: https://tailwindcss.com/docs

### Custom utilities

Custom utilities are defined with `@utility` in `index.css`:

- `stack` — CSS grid overlay (all children occupy the same grid cell)
- `gx-wrap-break-word` — safe word-breaking for long content
- `content-auto` / `content-hidden` / `content-visible` — `content-visibility` for virtualization performance
- `intrinsic-size-*` — `contain-intrinsic-size` mapped to the spacing scale

### Z-index scale

A semantic z-index scale prevents stacking conflicts:

| Token       | Value | Use                 |
| ----------- | ----- | ------------------- |
| `z-appBar`  | 1000  | Top navigation bar  |
| `z-panes`   | 1100  | Side panes / panels |
| `z-modal`   | 1200  | Modal dialogs       |
| `z-popover` | 1300  | Popovers            |
| `z-menu`    | 1400  | Dropdown menus      |
| `z-tooltip` | 1500  | Tooltips            |

### Background images

Named gradients available as `bg-*` classes:

- `bg-logo-gradient` — the Graph Explorer brand mark gradient
- `bg-empty-info-gradient` — info empty-state icon (primary → brand-300)
- `bg-empty-error-gradient` — error empty-state icon (danger → red-300)

### Typography

- Font family: Tailwind's default sans stack (`ui-sans-serif, system-ui, sans-serif, ...`). The app renders in the platform system font (San Francisco on macOS, Segoe UI on Windows). No custom font is loaded.
- Font weights: Tailwind's default scale. In practice the app uses `font-normal` (400), `font-medium` (500), `font-semibold` (600), and `font-bold` (700).
- Base font size: 14px (set on `html`)
- Max prose width: `max-w-paragraph` (80ch) — for readable line lengths in body text

### Animations

Two shared keyframes for collapsible regions: `expand` and `collapse` (0.2s, `cubic-bezier(0.87, 0, 0.13, 1)` — a sharp ease-in-out-quint curve). These rely on `interpolate-size: allow-keywords` on `html` to animate `height: auto`.

The `tw-animate-css` library is imported and provides enter/exit animation utilities (`animate-in`, `animate-out`, `fade-in-0`, `zoom-in-95`, etc.) used by popovers, dialogs, and dropdown menus.

## Source of Truth

All styling tokens, utilities, and theme values live in one file: `packages/graph-explorer/src/index.css`. There is no separate JS config file.
