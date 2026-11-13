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

## Alerts

Docs site pages and Repo Markdown both use GitHub alerts for notices. Don't write Starlight asides (`:::note`).

Put the marker on its own line, then an empty `>` line, then the message. The empty line is there because the formatter joins prose onto one line (`proseWrap: never`), and a marker followed by its message on the same line renders as a plain quote.

```md
> [!WARNING]
>
> Message goes here
```

| Alert          | Use for                     |
| -------------- | --------------------------- |
| `[!NOTE]`      | good to know while skimming |
| `[!TIP]`       | do it better or more easily |
| `[!IMPORTANT]` | key to the reader's goal    |
| `[!WARNING]`   | urgent, needs attention now |
| `[!CAUTION]`   | risk of a bad outcome       |

The same claim gets the same alert everywhere it appears. A page carrying three alerts in a row has an ordering problem, not an emphasis problem.

## Two surfaces

| Surface | Where |
| --- | --- |
| Docs site | `packages/docs/src/content/docs/**/*.mdx` |
| Repo Markdown | `README.md`, `Changelog.md`, `ROADMAP.md`, `docs/**`, `samples/**`, `.github/**` |

## Docs site

User docs live in `packages/docs/src/content/docs/`. A section is a directory with an `index.mdx` hub page. Other pages are kebab-case `.mdx` files.

Every page starts with frontmatter. `title` and `description` are both required. Starlight renders `title` as the page's H1, so body headings start at `##`.

```mdx
---
title: "Schema View"
description: Visualize the schema of your graph database.
---
```

A new page in Features, Guides, or References gets a `LinkCard` with its `description` in its section's `index.mdx`.

Starlight generates each page's table of contents, so don't hand-write a list of links to headings on the same page.

Tag every code fence with a language: `bash` only for commands a reader runs, and `ini` for environment settings. Write image alt text that says what the image shows.

### Links

A link to another page is relative to the page's URL, ends in a slash, and has no file extension. Page URLs end in a slash, so a sibling page is `../sibling/` and a page in another section is `../../references/configuration/`. From a section's `index.mdx`, a page in that section is `./page/`.

```mdx
[Configuration](../../references/configuration/#host)
```

A link to a repo file that isn't a page, such as a sample policy, a script, or `docs/development.md`, uses its GitHub URL, `https://github.com/aws/graph-explorer/blob/main/<path>`. Never write a root-absolute internal link, which would need the `/graph-explorer` base path.

### Procedures

Write a procedure as a plain Markdown ordered list. Indent an alert or code block that belongs to a step under that step so the list stays one list. Don't wrap it in Starlight's `Steps` component.

### Components

Import them from `@astrojs/starlight/components`:

- `Card`, `CardGrid`, and `LinkCard` for section hub pages
- `Badge` for an environment variable whose type or default is a single code literal, right under its heading

### Assets

Images, policies, and scripts a page uses go in its section's `_assets/` directory.

`public/images/` holds only the landing page screenshots. Retake them with `docs/agents/docs-screenshots.md`.

### Look and feel

The site has its own theme, separate from the app's. Read `packages/docs/DESIGN.md` before changing `packages/docs/src/styles/` or `packages/docs/src/components/`.

### Build and publish

Run `vp run docs:build` after editing a page.

## Docs that mirror code

- `packages/docs/src/content/docs/references/security.mdx#reference-for-access-control-layers` copies the proxy server's routes, methods, request headers, forwarded response headers, body limit, and the Default Connection's Fetch Timeout. A change to any of them updates that section.
- A new deployment guide gets the example paragraph after its opening paragraph and the access control `[!IMPORTANT]` alert, both worded identically to the existing guides, and a row in the deployment table in `packages/docs/src/content/docs/references/security.mdx#access-control`.

## `NEPTUNE_NOTEBOOK`

Wherever a user doc covers notebook behavior, including the configuration reference, document the individual variables: `PROXY_SERVER_HTTPS_CONNECTION=false`, `PROXY_SERVER_PORT=9250`, and `LOG_STYLE=cloudwatch`. `NEPTUNE_NOTEBOOK` is the unsupported legacy preset that sets them, kept only so existing deployments keep working, and it goes away with [#2312](https://github.com/aws/graph-explorer/issues/2312). User docs leave it out. The configuration reference's Precedence section and upgrade notes may name it, to say how a deployment that already sets it starts. Elsewhere, document the individual variables. `packages/docs/src/content/docs/guides/_assets/install-graph-explorer-lc.sh` keeps passing it until then.

## Repo Markdown

Files GitHub renders use the GitHub alerts from [Alerts](#alerts).

Relative links climb at most two levels (`../../`). Past that, link from the repo root with a `/`-rooted path such as `/docs/development.md`, which GitHub resolves from the repo root.

Link a user page by its live URL, `https://aws.github.io/graph-explorer/<section>/<page>/`. Name its source path in a code span only when the reader is meant to open the file to edit it. Agent docs, `GLOSSARY.md`, and ADRs cite the source path so an agent can open the file; only Markdown written for people links the live URL.
