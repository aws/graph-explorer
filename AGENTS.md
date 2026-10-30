# Agent Rules

Read `CODING_STANDARDS.md` before writing or reviewing code.

## Core Rules

- Every commit should have no type errors, lint errors, formatting issues, or failing tests
- Don't hard-wrap Markdown prose to a fixed column width, let it soft-wrap
- Write temporary files (scratch notes, intermediate output) to the git-ignored `.scratch/` directory at the repo root, never elsewhere in the tree
- Don't change the VS Code setting `typescript.autoClosingTags`

## Git

- Single trunk branch `main`, always releasable
- No branch or commit message prefixes (no `chore:`, `fix:`, `feature/`, etc.)
- Each commit is self-contained and cohesive — one logical change per commit
- Keep commit messages brief and descriptive

## Conventions

Read the relevant doc before working in that area:

- `docs/agents/design.md` — visual design system: color tokens, dark mode policy, Tailwind conventions
- `docs/agents/react.md` — components, hooks, state, forms, concurrent rendering, accessibility, query-language translation
- `docs/agents/testing.md` — Vitest patterns, DbState, factories, backward-compat
- `docs/agents/connectors.md` — Gremlin/openCypher/SPARQL query templates
- `docs/agents/schema.md` — schema storage, discovery, Jotai atoms
- `docs/agents/browser-floor.md` — supported browsers and how build, types, and lint enforce them
- `docs/agents/issue-tracker.md` — GitHub issue and PR conventions
- `docs/agents/documentation.md` — writing user-facing docs (READMEs, guides, docs site)
- `docs/agents/product.md` — product overview, supported databases, architecture
- `docs/development.md` — toolchain setup, the pinned pnpm and node versions, and the pnpm upgrade procedure

## Reviews

Every code review, including `/code-review`, uses these standards sources:

- `REVIEW.md` — severity, what not to report, and the verification bar. Wins where it conflicts with the others.
- `CODING_STANDARDS.md`, plus the `docs/agents/*.md` doc for each area the diff touches.

Pass `REVIEW.md` and `CODING_STANDARDS.md` by path to every reviewer sub-agent, not only the standards one. Sub-agents don't always load them.

<!-- `vp config` rewrites the Vite+ block below from node_modules/vite-plus on install, so edits inside it are lost. The ignore markers stop the formatter from reflowing it, which would fight that rewrite. -->
<!-- prettier-ignore-start -->
<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
<!-- prettier-ignore-end -->

## Commands

Run from the project root. Bare `tsc`, `tsgo`, `vitest`, `oxlint`, and `oxfmt` use the wrong version and miss project context, so always go through `vp`, never through those tools directly or via `pnpx`. Without the global `vp` CLI, prefix each command with `pnpm exec`. The `pnpm` scripts in `package.json` are aliases for humans.

- `vp check` — format, lint, and type checks; default validation for small changes
- `vp check --fix` — the same, fixing what it can
- `vp test` — run all tests once
- `vp test <path>` — test files matching a path substring (file, dir, or partial)
- `vp test -t "suite > name"` — test by name, with segments joined by a spaced `>` exactly as the reporter prints them; a single segment such as `-t "renders empty state"` also works
- `pnpm dedupe --check` — after a dependency change, confirms the lockfile has no drift; CI runs it

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on aws/graph-explorer; external PRs are also a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

`CONTEXT.md` was renamed to `GLOSSARY.md`. When a skill or doc asks for `CONTEXT.md` or `CONTEXT-MAP.md`, use `GLOSSARY.md` or `GLOSSARY-MAP.md` instead.
