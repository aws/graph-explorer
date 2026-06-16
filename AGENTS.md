# Agent Rules

## Core Rules

- Prefer descriptive variable and function names over code comments
- Prefer simple to follow logic over clever concise code
- Every commit should have no type errors, lint errors, formatting issues, or failing tests
- Don't hard-wrap Markdown prose to a fixed column width, let it soft-wrap
- When possible, create failing tests first then implement the logic to make the tests pass
- Add or update tests for the code you change, even if nobody asked
- For TypeScript conventions and rules, refer to `.kiro/skills/typescript/SKILL.md`
- For Tailwind style guidelines, refer to `.kiro/skills/tailwind/SKILL.md`
- For testing patterns and examples, refer to `.kiro/skills/testing/SKILL.md`
- For code organization patterns and conventions, refer to `.kiro/skills/connectors/SKILL.md`
- For React related patterns and conventions, refer to `.kiro/skills/react/SKILL.md`
- For schema storage and discovery, refer to `.kiro/skills/schema/SKILL.md`
- For GitHub issue and PR management, refer to `.kiro/skills/github/SKILL.md`
- For git workflow conventions, refer to `.kiro/skills/git/SKILL.md`
- For product overview and architecture, refer to `.kiro/skills/product/SKILL.md`

## Monorepo Commands

- **Always run commands from the project root** — never `cd` into a subfolder
- Only use scripts defined in the root `package.json`
- Use `pnpm` as the package manager

### Examples

```bash
# All checks (lint, format, types)
pnpm run checks

# All tests with coverage threshold enforcement
pnpm coverage

# Single test file
pnpm test packages/graph-explorer/src/path/to/file.test.ts

# Test name pattern match
pnpm test -- -t "pattern"

# Format all files
pnpm format

# Format specific files or globs (pass paths after --)
pnpm format -- src/foo.ts 'packages/graph-explorer/src/**/*.tsx'

# Check formatting on specific files
pnpm check:format -- src/foo.ts

# Lint and auto-fix all files
pnpm lint

# Lint specific files or globs
pnpm lint -- 'packages/graph-explorer/src/**/*.ts'
```

# Project Organization

## Key Architectural Patterns

- **State Management**: Use Jotai atoms for global state
- **Data Fetching**: Use TanStack Query for remote data
- **Graph Rendering**: Cytoscape.js with custom layout plugins
- **Query Abstraction**: Explorers that provide unified interfaces for different query languages
- **Configuration**: Environment variables and configuration providers
- **Error Handling**: Error boundaries and consistent error display components
- **State Persistence**: localforage for client-side persistence using IndexedDB

## Data Storage & Persistence

- **Client-Side Only**: Graph Explorer stores all user data and preferences client-side
- **No Server Storage**: The backend proxy server does not store any user data
- **IndexedDB**: Used as the primary storage mechanism via localforage
- **Persistence Scope**:
  - User preferences and settings
  - Connection configurations
  - Query history
  - Visualization settings
  - Layout preferences
- **External Data**: Graph data is queried directly from the connected graph databases and is not owned or persisted by Graph Explorer

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on aws/graph-explorer. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
