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
  button-padding-block: 0.625rem
  button-padding-inline: 1rem
components:
  link-button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: 0.625rem 1rem
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

In the front matter, `note`, `tip`, `caution`, `danger`, and `success` are Starlight's semantic colors, which badges use. They are not the alert colors.

## Overview

Dark first. Surfaces are near-black blue-grays, the accent is the app's brand blue, and a light theme is selected with `:root[data-theme="light"]`. The dark theme carries a faint noise texture on `body`. Link cards and the pagination links share one hover: the border turns accent. Nothing glows. The feature card changes only its border.

## Colors

Every color is oklch, except the `--ge-alert-*` tokens and the favicon, which are hex. Starlight's gray ramp (`--sl-color-gray-1` to `-7`) runs light to dark in the dark theme and is flipped in the light theme, so reference the variable and the flip comes for free.

Terminal boxes stay dark in both themes. Shell code blocks (`bash`, `sh`, `shell`, `zsh`) render in the dark code theme through the `dark-shell-blocks` Expressive Code plugin in `astro.config.mjs`, and the Run it locally box does the same. Both carry `.dark-surface`, which re-declares the dark tokens so Starlight's grays resolve dark inside them. The rules for tagging fences and writing image alt text are in `docs/agents/documentation.md`.

- **Accent** (`--sl-color-accent`, `-high`, `-low`, `-hover`): the app's brand blue, hue 247 to 258. `-hover` is `-high`. Used for links in page content, the active sidebar link, hovered titles, the icon in a card, and `.sl-link-button.secondary:hover`. The light theme uses a darker accent (`primary-light-theme`) for contrast on a light background.
- **Primary link button**: Starlight's stock button, a flat accent fill with page-background text. No gradient, no shadow.
- **Backgrounds**: `--sl-color-bg` is the page (`--sl-color-black` in the dark theme), and the nav and sidebar use `--sl-color-bg-nav` and `--sl-color-bg-sidebar`, both set to the page background. `--sl-color-gray-7` is the surface for cards, link cards, pagination links, and the screenshot carousel.
- **Semantic colors**: orange, green, blue, purple, and red, each with a base, `-high`, and `-low` variant. The light theme swaps the `-high` and `-low` values. Badges draw on these.
- **Alerts** follow GitHub's `markdown-alert` look: no fill, a 0.25em colored capsule bar at the start edge, and a colored title with a Lucide icon (`info`, `lightbulb`, `message-square-warning`, `triangle-alert`, `octagon-alert`). `NOTE` blue, `TIP` green, `IMPORTANT` purple, `WARNING` amber, `CAUTION` red, from the `--ge-alert-*` tokens in `src/styles/tokens.css`. Each passes 4.5:1 on its theme's background.
- **Badges**: the six `--sl-badge-*` sets give each variant a 15% alpha background with a matching border and text color, taken from the `-low` semantic color (default uses the accent).

## Typography

Inter at weights 400, 500, 600, 700, and 800, loaded from `@fontsource/inter`. Body line height is 1.6.

Headings use a minor-third scale (ratio 1.2) built from `--sl-text-sm`: `h1` is 1.2^5, `h2` is 1.2^4, down to `h6` at 1.2^0. Headings balance their wrapping and paragraphs use `text-wrap: pretty`.

- `h1` to `h3`: weight 800, letter spacing -0.03em.
- `h4` and `h5`: weight 700, letter spacing -0.015em.
- `h6`: weight 700, uppercase, letter spacing 0.035em, so it reads as a label.
- Content links: weight 500, no underline until hover or focus, then an underline in the current color. The rule skips `.sl-link-button`, since the accent link color would hide a primary button's label.
- Sidebar group labels: `--sl-text-xs`, uppercase, letter spacing 0.065em.
- Primary and secondary link buttons: weight 500.

## Layout

Page content is 80ch wide (`--sl-content-width`, up from Starlight's 45rem). Cards sit in `.card-grid` with a 1rem gap and have 1.5rem padding. Ordered lists are plain Markdown lists with gray tabular-number markers, never circled step numbers. Bulleted lists indent 1.5rem, less than the browser's 2.5em, so their text stays close to the body. The landing page screenshot carousel is capped at 78rem. Sidebar links have 0.35rem by 0.75rem padding, and nested sidebar items are not indented.

The header is Starlight's stock header with one change: the title is on the left, and search (up to 18rem wide) sits at the end of its column, beside a right group (GitHub link, theme select) that is hidden below 50rem. Search stays visible at every width, so phones keep it.

## Elevation & Depth

Shadows are off in the dark theme (`--sl-shadow-sm` and `-md` are `none`). The light theme sets layered blue-gray shadows from `--shadow-color`. The header is translucent (80% alpha) with a 12px backdrop blur and a 1px bottom border at 50% alpha. Images get a 1px inset outline (`outline-offset: -1px`) in `--image-outline`, white at 10% alpha in the dark theme and `--sl-color-gray-1` at 10% in the light theme, so a screenshot's white or dark edge never bleeds into the page. Markdown images (`.sl-markdown-content img`) carry it on the image with 0.5rem corners. The carousel viewport carries it on the frame, with a soft two-layer shadow (1px 2px, then 16px 40px in the dark theme and 12px 32px in the light theme). The screenshots themselves are bare viewport captures with no browser chrome, shadow, or backdrop.

## Shapes

Three surface radii:

- `0.375rem` on sidebar links
- `0.5rem` on link buttons, the carousel viewport, Markdown images, code blocks, and the Run it locally card
- `0.75rem` on cards, link cards, pagination links, and the feature card

The carousel's round buttons (`50%`) and dots (`4px`) and the alerts' capsule bar (`999px`) are component details outside these three. Card borders are 1px at low-alpha gray in the dark theme.

## Components

- **Link button**: `.sl-link-button`, padded 0.625rem by 1rem. Its icon is 1.25rem. `primary` is a flat accent fill. `secondary` is a 1px gray outline that turns accent on hover.
- **Card** (`Card` in `CardGrid`): surface background, 0.75rem radius, accent-colored icon with no frame, body text in `--sl-color-gray-3`. Used on section hub pages.
- **Link card** (`LinkCard`): same surface and radius, 1px gray border that turns accent on hover, title at `--sl-text-h5`, description at `--sl-text-sm`, and no link underline.
- **Feature card** (`FeatureCard.astro`): the landing page's card. Its whole area is clickable through a pseudo-element on the link, the border turns accent on hover, and padding scales with the viewport. It takes an `icon` slot and a title.
- **Favicon** (`public/favicon.svg`): the app's `GraphExplorerIcon` symbol on a tile with 7/32 rounded corners, in the docs accent rather than the app's gradient: a `#0d5d97` tile with a white symbol in light mode, and a `#88bcfd` tile with a `#020618` symbol in dark mode, switched by `prefers-color-scheme`. These are `--sl-color-accent` and `--sl-color-black` as hex, since favicons are parsed outside the page's CSS. `favicon.ico` (16 and 32px) and the opaque, square-cornered 180px `apple-touch-icon.png` are rendered from the light tile.
- **Site logo** (`src/assets/logo-light.svg`, `src/assets/logo-dark.svg`): the favicon tile, one file per theme, beside the "Graph Explorer" title in the header, 2rem tall and 0.625rem from it. Starlight swaps them with the site's theme, so they follow the theme picker rather than the system setting.
- **Screenshot carousel** (`ScreenshotCarousel.astro`): landing page only. Slides, previous and next buttons, dots, and a caption that follows the current slide. It never advances on its own, and hidden slides are `inert`. Its script reinitializes after a view transition.
- **Hero** (`Hero.astro`): overrides Starlight's hero with a left-aligned title, tagline, and action buttons on the 78rem column the screenshot carousel uses (the landing page widens `.sl-container` to 78rem; prose pages stay at 80ch), so the first screenshot shows above the fold. Only the landing page has a hero. From 64rem up, the Run it locally box (`RunLocally.astro`) sits in a 32rem right column, 1.5rem down so it aligns with the hero text; below that it stacks after the buttons. No background art or motion.
- **Run it locally** (`RunLocally.astro`): a card on `--sl-color-gray-7` at 0.5rem radius with a 1px `--sl-color-gray-6` border. A header row holds the title, "Run the air routes sample", and a Copy button that swaps to a check and announces "Command copied" through a status region. When the browser refuses the clipboard write, the button reads "Failed" in `--sl-color-red` with a circle-x icon, and the status region announces "Copy failed. Select the command to copy it." Both states reset after two seconds. Below it is one command that clones the repo and starts the sample with Docker Compose, joined with `&&` at each line end so a single paste runs it. Each program name (`git`, `cd`, `docker`) is semibold `--sl-color-accent-high`. A footer row links to `localhost:8080/explorer` and the sample's README. On narrow screens a long line wraps with a 2ch hanging indent rather than scrolling.
- **404 page** (`src/pages/404.astro`): replaces Starlight's 404, which is turned off with `disable404Route`. It is a splash page with no hero, so the Run it locally box never appears on it. One centered group, set lower on the page: the "Page not found" heading, a lead line pointing to the search and the docs home, a primary "Go to the docs home" button, and a small line linking to GitHub issues to report a broken link. The page hides the rule between the title panel and the content panel so the group reads as one. The button links to the site root through `import.meta.env.BASE_URL`, since the 404 is served at any depth.
- **Code blocks**: Expressive Code with 0.5rem corners, set by `styleOverrides` in `astro.config.mjs`. Other fences get the card border (`--sl-color-gray-1` at 7.5% alpha) and `--sl-shadow-sm`. Terminal blocks get the screenshots' `--image-outline` border and no shadow.
- **Badges**: `Badge` shows a variable's type or default under its heading when it is a single code literal, using the badge colors above.

## Do's and Don'ts

- Do override Starlight variables in `tokens.css` and keep a dark and a light value for every color you add.
- Do use the `--sl-color-*` variables in component styles so both themes work.
- Do use `--sl-transition` for hover transitions.
- Do check a style change in both themes and at 375px and desktop width.
- Don't introduce a fourth surface radius or a gradient.
- Don't set `--sl-shadow-sm` or `--sl-shadow-md` in the dark theme.
- Don't color text with a literal value that has no light-theme counterpart.
