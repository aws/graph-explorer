# Documentation

How to write user-facing docs (READMEs, guides, the docs site). For agent-facing convention docs, match the terse style of the files in this folder instead.

- Professional, clear, accessible to technical and non-technical readers
- Concise — get to the point; no filler
- Write from the reader's perspective: their goal, their pain point
- State prerequisites up front — what the reader needs before starting
- kebab-case file names (`getting-started.mdx`)
- No emojis
- Avoid emdashes and semicolons if possible

## Pitch to the audience

- **End users (analysts, researchers)**: business value and use cases, step-by-step tutorials with screenshots, minimal jargon, troubleshooting for common mistakes
- **Administrators**: deployment/configuration, security, performance tuning, monitoring and maintenance
- **Developers/contributors**: architecture, dev setup, contribution guidelines, API references

## Two surfaces

| Surface | Where | Notices |
| --- | --- | --- |
| Docs site | `packages/docs/src/content/docs/**/*.mdx` | Starlight asides (`:::note`) |
| Repo Markdown | `README.md`, `Changelog.md`, `ROADMAP.md`, `docs/**`, `samples/**`, `.github/**` | GitHub alerts (`> [!NOTE]`) |

They don't mix. Starlight renders a GitHub alert as a plain blockquote with a literal `[!NOTE]`, and GitHub renders an aside as literal `:::note` text. Neither fails a build.

## Docs site

User docs live in `packages/docs/src/content/docs/`. A section is a directory with an `index.mdx` hub page. Other pages are kebab-case `.mdx` files.

Every page starts with frontmatter. `title` is required, and Starlight renders it as the page's H1, so body headings start at `##`.

```mdx
---
title: "Schema View"
description: Visualize the schema of your graph database.
---
```

Starlight generates each page's table of contents, so don't hand-write a list of links to headings on the same page.

### Asides

Put a blank line after the opening marker and before the closing one. The formatter joins prose onto one line (`proseWrap: never`), and without the blank lines it folds the whole aside into one line that renders as plain text.

```mdx
:::caution

Message goes here

:::
```

| Aside | Use for | Replaces |
| --- | --- | --- |
| `:::note` | good to know while skimming | `[!NOTE]` |
| `:::tip` | do it better or more easily | `[!TIP]` |
| `:::caution` | key to the reader's goal, or urgent | `[!IMPORTANT]`, `[!WARNING]` |
| `:::danger` | risk of a bad outcome | `[!CAUTION]` |

The same claim gets the same aside everywhere it appears. A page carrying three asides in a row has an ordering problem, not an emphasis problem.

### Links

A link to another page is relative to the page's URL, ends in a slash, and has no file extension. Page URLs end in a slash, so a sibling page is `../sibling/` and a page in another section is `../../references/configuration/`. From a section's `index.mdx`, a page in that section is `./page/`.

```mdx
[Configuration](../../references/configuration/#host)
```

A link to a repo file that isn't a page, such as a sample policy, a script, or `docs/development.md`, uses its GitHub URL, `https://github.com/aws/graph-explorer/blob/main/<path>`. Never write a root-absolute internal link, which would need the `/graph-explorer` base path.

### Components

Import them from `@astrojs/starlight/components`:

- `Steps` wraps a numbered procedure, which must be one ordered list, so indent an aside or code block that belongs to a step under that step
- `Tabs` and `TabItem` for alternatives, such as a JSON file versus environment variables
- `Card`, `CardGrid`, and `LinkCard` for section hub pages
- `Badge` for an environment variable's type and default, right under its heading
- `Code` with a `?raw` import to show a file from `_assets/`

### Assets

Images, policies, and scripts a page uses go in its section's `_assets/` directory.

`public/images/` holds only the landing page screenshots.

### Look and feel

The site has its own theme, separate from the app's. Read `packages/docs/DESIGN.md` before changing `packages/docs/src/styles/` or `packages/docs/src/components/`.

### Build and publish

`vp run docs:dev` serves the site locally. `vp run docs:build` builds it and then runs the link checker, which fails on a link to a missing page, file, or anchor. CI runs the build on every pull request. A merge to `main` that changes `packages/docs/**` deploys the site to https://aws.github.io/graph-explorer/.

## Docs that mirror code

- `packages/docs/src/content/docs/references/security.mdx#reference-for-access-control-layers` copies the proxy server's routes, methods, request headers, forwarded response headers, body limit, and the Default Connection's Fetch Timeout. A change to any of them updates that section.
- A new deployment guide gets the example paragraph after its opening paragraph and the access control `:::caution` aside, both worded identically to the existing guides, and a row in the deployment table in `packages/docs/src/content/docs/references/security.mdx#access-control`.

## `NEPTUNE_NOTEBOOK`

Wherever a user doc covers notebook behavior, including the configuration reference, document the individual variables: `PROXY_SERVER_HTTPS_CONNECTION=false`, `PROXY_SERVER_PORT=9250`, and `LOG_STYLE=cloudwatch`. `NEPTUNE_NOTEBOOK` is the unsupported legacy preset that sets them, kept only so existing deployments keep working, and it goes away with [#2312](https://github.com/aws/graph-explorer/issues/2312). User docs leave it out. `packages/docs/src/content/docs/guides/_assets/install-graph-explorer-lc.sh` keeps passing it until then.

## Repo Markdown

Files GitHub renders use GitHub alerts.

Use for notices and warnings. The marker goes on its own line, followed by an empty blockquote line, then the message. The empty line is required because the formatter joins prose onto one line (`proseWrap: never`), which breaks the alert:

```
> [!CAUTION]
>
> Message goes here
```

Available markers:

- `[!NOTE]` — good to know while skimming
- `[!TIP]` — do it better or more easily
- `[!IMPORTANT]` — key to the reader's goal
- `[!WARNING]` — urgent; avoids a problem
- `[!CAUTION]` — risk of a bad outcome

Relative links climb at most two levels (`../../`). Past that, link from the repo root with a `/`-rooted path such as `/docs/development.md`, which GitHub resolves from the repo root.
