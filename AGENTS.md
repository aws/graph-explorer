# Agent Rules

## Core Rules

- Every commit should have no type errors, lint errors, formatting issues, or failing tests
- Don't hard-wrap Markdown prose to a fixed column width, let it soft-wrap
- When possible, create failing tests first then implement the logic to make the tests pass
- Add or update tests for the code you change, even if nobody asked

## Code Quality Standards

Correct behavior is necessary but not sufficient — structural quality is a hard requirement. Don't accept a messy implementation just because it passes tests.

- Follow YAGNI principles.
- Prefer deep modules: simple interface, substantial implementation.
- Prefer descriptive variable and function names over code comments.
- Prefer single-pass, copy-free processing for collections that can grow large; small fixed lists don't need it.
- Prefer "code judo": restructurings that delete whole layers, branches, or concepts rather than rearrange them. Don't stop at "a bit cleaner."
- Don't push a file from under 1000 lines to over without explicit justification — treat the boundary as a decomposition signal and extract instead.
- Push new conditionals and special cases into a dedicated helper, state machine, or module — don't tangle them into an unrelated flow.
- Prefer direct, legible code. Flag thin wrappers, identity abstractions, and generic mechanisms that hide simple structure.
- Avoid unnecessary `any`, `unknown`, casts, or optionality; make invariants explicit at boundaries instead of papering over them with silent fallbacks.
- Keep feature logic in the feature layer; reuse existing canonical helpers instead of introducing near-duplicates in shared modules.
- Don't serialize independent work or leave related state half-applied when a more atomic structure is available.

## TypeScript

- Prefer named function syntax over anonymous arrow functions for module-level declarations (`function handleClick() {}`, not `const handleClick = () => {}`). Arrow functions inside a function body are fine.
- Use an explicit type alias instead of `ReturnType<typeof ...>` when one exists (e.g. `AppStore`, not `ReturnType<typeof getAppStore>`)
- Prefer a branded type over a raw `string`/`number` whenever the value is used for a lookup or passed to a function expecting a value that represents a specific concept — an ID, a node/edge label, a type name, etc. Construct them with their creator function (e.g. `createVertexId()`); never cast a bare string. This makes "which kind of string is this" a compile-time guarantee.
- Don't change the VS Code setting `typescript.autoClosingTags`

## Git

- Single trunk branch `main`, always releasable
- No branch or commit message prefixes (no `chore:`, `fix:`, `feature/`, etc.)
- Each commit is self-contained and cohesive — one logical change per commit
- Keep commit messages brief and descriptive

## Conventions

Read the relevant doc before working in that area:

- `docs/agents/react.md` — components, hooks, query-language translation
- `docs/agents/tailwind.md` — Tailwind v4 styling, responsive, data attributes
- `docs/agents/testing.md` — Vitest patterns, DbState, factories, backward-compat
- `docs/agents/connectors.md` — Gremlin/openCypher/SPARQL query templates
- `docs/agents/schema.md` — schema storage, discovery, Jotai atoms
- `docs/agents/issue-tracker.md` — GitHub issue and PR conventions
- `docs/agents/documentation.md` — writing user-facing docs (READMEs, guides, docs site)
- `docs/agents/product.md` — product overview, supported databases, architecture

## Commands

Run from project root with `pnpm`. Use only these scripts — never invoke `tsc`, `vitest`, `oxlint`, or `oxfmt` directly or via `pnpx`. The scripts pin tool versions and configs and cover every workspace package; bare tools use the wrong version and miss project context.

- `pnpm check:types` — typecheck all packages (no per-file/per-package option; this is the granularity)
- `pnpm checks` — all static checks (types + lint + format); default validation for small changes
- `pnpm check:lint` / `pnpm lint` — lint / lint and fix
- `pnpm check:format` / `pnpm format` — check / fix formatting
- `pnpm test` — run all tests
- `pnpm test <path>` — test files matching a path substring (file, dir, or partial)
- `pnpm test -- -t "pattern"` — test by name
- `pnpm coverage` — tests with coverage

`pnpm check:types` runs in parallel across packages in under a minute; just run it.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on aws/graph-explorer; external PRs are also a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
