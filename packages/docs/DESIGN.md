---
version: alpha
name: Graph Explorer docs site
description: The Starlight theme for the Graph Explorer documentation site, a dark-first skin over Starlight's defaults, accented with the app's blue brand.
colors:
  primary: "oklch(78.4% 0.108 254.45)"
  primary-high: "oklch(85.4% 0.071 258.35)"
  primary-low: "oklch(25% 0.063 247.66)"
  primary-light-theme: "oklch(46.5% 0.117 247.2)"
  background: "oklch(12.9% 0.042 264.695)"
  background-light-theme: "oklch(96.8% 0.007 247.896)"
  surface: "oklch(20.8% 0.042 265.755)"
  surface-raised: "oklch(27.9% 0.041 260.031)"
  border: "oklch(37.2% 0.044 257.287)"
  text-muted: "oklch(70.4% 0.04 256.788)"
  text: "oklch(98.4% 0.003 247.858)"
  note: "oklch(70.7% 0.165 254.624)"
  tip: "oklch(71.4% 0.203 305.504)"
  caution: "oklch(75% 0.183 55.934)"
  danger: "oklch(64.5% 0.246 16.439)"
  success: "oklch(72.3% 0.219 149.579)"
typography:
  body:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  heading:
    fontFamily: Inter
    fontWeight: 800
    letterSpacing: -0.03em
  heading-minor:
    fontFamily: Inter
    fontWeight: 700
    letterSpacing: -0.015em
  label:
    fontFamily: Inter
    fontWeight: 700
    letterSpacing: 0.035em
rounded:
  sm: 0.375rem
  md: 0.5rem
  lg: 0.75rem
  full: 50%
spacing:
  card-gap: 1rem
  card-padding: 1.5rem
  button-padding-block: 0.85rem
  button-padding-inline: 1.3rem
components:
  link-button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: 0.85rem 1.3rem
  link-button-secondary:
    textColor: "{colors.text-muted}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 1.5rem
  sidebar-link-active:
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
---

# Graph Explorer docs site design

Governs the styling of `packages/docs`: `src/styles/tokens.css`, `src/styles/custom.css`, and the components in `src/components/`. The Graph Explorer application has its own system in `docs/agents/design.md`. The two share the blue brand (hue about 247, `packages/graph-explorer/src/index.css`), not tokens.

The site is Starlight with the Starlight CSS variables overridden. Change a color, font, or shadow by setting the `--sl-*` variable in `tokens.css`, not by restating the value on an element.

## Overview

Dark first. Surfaces are near-black blue-grays, the accent is the app's brand blue, and a light theme is selected with `:root[data-theme="light"]`. The dark theme carries a faint noise texture on `body`. Link cards and the pagination links share one hover: the border turns accent. Nothing glows. The feature card changes only its border.

## Colors

Every color is oklch. Starlight's gray ramp (`--sl-color-gray-1` to `-7`) runs light to dark in the dark theme and is flipped in the light theme, so reference the variable and the flip comes for free.

- **Accent** (`--sl-color-accent`, `-high`, `-low`, `-hover`): the app's brand blue, hue 247 to 258. `-hover` is `-high`. Used for links in page content, the active sidebar link, hovered titles, the icon in a card, and `.sl-link-button.secondary:hover`. The light theme uses a darker accent (`primary-light-theme`) for contrast on a light background.
- **Primary link button**: Starlight's stock button, a flat accent fill with page-background text. No gradient, no shadow.
- **Backgrounds**: `--sl-color-bg` is the page (`--sl-color-black` in the dark theme), and the nav and sidebar use `--sl-color-bg-nav` and `--sl-color-bg-sidebar`, both set to the page background. `--sl-color-gray-7` is the surface for cards, link cards, pagination links, and the screenshot carousel.
- **Semantic colors**: orange, green, blue, purple, and red, each with a base, `-high`, and `-low` variant. The light theme swaps the `-high` and `-low` values. Badges draw on these.
- **Alerts** follow GitHub's `markdown-alert` look: no fill, a 0.25em colored start border, and a colored title with its octicon. `NOTE` blue, `TIP` green, `IMPORTANT` purple, `WARNING` amber, `CAUTION` red, from the `--ge-alert-*` tokens in `src/styles/tokens.css`. Each passes 4.5:1 on its theme's background.
- **Badges**: the six `--sl-badge-*` sets give each variant a 15% alpha background with a matching border and text color, taken from the `-low` semantic color (default uses the accent).

## Typography

Inter at weights 400, 500, 600, 700, and 800, loaded from `@fontsource/inter`. Body line height is 1.6.

Headings use a minor-third scale (ratio 1.2) built from `--sl-text-sm`: `h1` is 1.2^5, `h2` is 1.2^4, down to `h6` at 1.2^0. Headings balance their wrapping and paragraphs use `text-wrap: pretty`.

- `h1` to `h3`: weight 800, letter spacing -0.03em.
- `h4` and `h5`: weight 700, letter spacing -0.015em.
- `h6`: weight 700, uppercase, letter spacing 0.035em, so it reads as a label.
- Content links: weight 500, no underline until hover or focus, then an underline in the current color.
- Sidebar group labels: `--sl-text-xs`, uppercase, letter spacing 0.065em.
- Primary and secondary link buttons: weight 500.

## Layout

Page content is 80ch wide (`--sl-content-width`, up from Starlight's 45rem). Cards sit in `.card-grid` with a 1rem gap and have 1.5rem padding. Ordered lists are plain Markdown lists with gray tabular-number markers, never circled step numbers. The landing page screenshot carousel is capped at 72rem. Sidebar links have 0.35rem by 0.75rem padding, and nested sidebar items are not indented.

The header is Starlight's stock header with one change: the title is on the left, and search (up to 18rem wide) sits at the end of its column, beside a right group (GitHub link, theme select) that is hidden below 50rem. Search stays visible at every width, so phones keep it.

## Elevation & Depth

Shadows are off in the dark theme (`--sl-shadow-sm` and `-md` are `none`). The light theme sets layered blue-gray shadows from `--shadow-color`. The header is translucent (80% alpha) with a 12px backdrop blur and a 1px bottom border at 50% alpha. The carousel viewport frames each screenshot with a 1px inset outline and a soft two-layer shadow (1px 2px, then 16px 40px in the dark theme and 12px 32px in the light theme). The screenshots themselves are bare viewport captures with no browser chrome, shadow, or backdrop.

## Shapes

Three surface radii:

- `0.375rem` on sidebar links
- `0.5rem` on link buttons and the carousel viewport
- `0.75rem` on cards, link cards, pagination links, and the feature card

The carousel's round buttons (`50%`) and dots (`4px`) are component details outside these three. Card borders are 1px at low-alpha gray in the dark theme.

## Components

- **Link button**: `.sl-link-button`, padded 0.85rem by 1.3rem. `primary` is a flat accent fill. `secondary` is a 1px gray outline that turns accent on hover. `minimal` is text that turns accent on hover.
- **Card** (`Card` in `CardGrid`): surface background, 0.75rem radius, accent-colored icon with no frame, body text in `--sl-color-gray-3`. Used on section hub pages.
- **Link card** (`LinkCard`): same surface and radius, 1px gray border that turns accent on hover, title at `--sl-text-h5`, description at `--sl-text-sm`, and no link underline.
- **Feature card** (`FeatureCard.astro`): the landing page's card. Its whole area is clickable through a pseudo-element on the link, the border turns accent on hover, and padding scales with the viewport. It takes an `icon` slot and a title.
- **Favicon** (`public/favicon.svg`): the app's logo tile, a 225 degree `#4d72f2` to `#3334b9` gradient with 7/32 rounded corners and the white `GraphExplorerIcon`. `favicon.ico` (16 and 32px) and the opaque 180px `apple-touch-icon.png` are rendered from it.
- **Screenshot carousel** (`ScreenshotCarousel.astro`): landing page only. Slides, previous and next buttons, dots, and a caption that follows the current slide. It never advances on its own, and hidden slides are `inert`. Its script reinitializes after a view transition.
- **Hero** (`Hero.astro`): overrides Starlight's hero with a left-aligned title, tagline, and action buttons on the 72rem column the screenshot carousel uses, so the first screenshot shows above the fold. From 64rem up, the Run it locally box (`RunLocally.astro`) sits in a 26rem right column; below that it stacks after the buttons. No background art or motion.
- **Run it locally** (`RunLocally.astro`): a 1px top rule, an uppercase label, a Copy button that swaps to a check and announces "Commands copied" through a status region, the three commands that clone the repo and start the air routes sample with Docker Compose on the card surface at 0.5rem radius, each program name (`git`, `cd`, `docker`) in semibold `--sl-color-accent-high`, and a note linking to the tutorial and the sample's README. The command block scrolls sideways on narrow screens rather than wrapping.
- **Tabs**: tab links are gray and turn white on hover. The selected tab is accent colored.
- **Badges**: `Badge` shows an environment variable's type and default under its heading, using the badge colors above.

## Do's and Don'ts

- Do override Starlight variables in `tokens.css` and keep a dark and a light value for every color you add.
- Do use the `--sl-color-*` variables in component styles so both themes work.
- Do use `--sl-transition` for hover transitions.
- Do check a style change in both themes and at 375px and desktop width.
- Don't introduce a fourth surface radius or a gradient.
- Don't set `--sl-shadow-sm` or `--sl-shadow-md` in the dark theme.
- Don't color text with a literal value that has no light-theme counterpart.
