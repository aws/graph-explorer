---
name: react
description: React component patterns, hooks, naming conventions, and the query-language translation system for Graph Explorer.
tools:
  [
    "fs_read",
    "code",
    "read",
    "write",
    "grep",
    "glob",
    "web_search",
    "web_fetch",
  ]
---

## React Version & Compiler

- This project uses React 19
- The React Compiler is enabled — it auto-memoizes components and hooks, so manual `useMemo`, `useCallback`, and `React.memo` are unnecessary in most cases and should be avoided unless profiling shows a specific need
- Official React docs: https://react.dev

## General

- Prefer functional components with hooks over class components
- Keep components small, focused on single responsibility
- Avoid prop drilling - use context or state management
- Follow principle of least privilege for component props

## Feature Modules

- Feature modules in `src/modules/` contain all related components, hooks, and utilities
- Each module exports its public API through an index file
- Modules should be self-contained with minimal dependencies on other modules

## Naming conventions

- **React Components**: PascalCase (e.g., `GraphViewer.tsx`)
- **Component Folders**: PascalCase with index exports
- **Hooks**: camelCase with `use` prefix (e.g., `useGraphData.ts`)

## Translations (Query-Language Labels)

The translation system is not used for locale/language translations. Instead, it swaps UI labels based on the active connection's query language. Each query language (Gremlin, openCypher, SPARQL) has its own JSON file in `src/hooks/translations/` that maps keys to display strings (e.g., `"node-type"` → `"Node Label"` in Gremlin vs `"Class"` in SPARQL).

Key files:

- `src/hooks/useTranslations.ts` — `useTranslations()` hook returns a `t` function scoped to the current query engine
- `src/hooks/translations/gremlin-translations.json`
- `src/hooks/translations/openCypher-translations.json`
- `src/hooks/translations/sparql-translations.json`

Usage:

```tsx
const t = useTranslations();
// t("node-type") → "Node Label" (Gremlin) or "Class" (SPARQL)
```

Key naming conventions:

- Lower-case kebab-case (e.g., `node-type`, `edge-connections`)
- Keys should read naturally as stand-ins for the word they represent
- Keys typically match one of the query language terms or the codebase vocabulary
- Nested keys use dot notation when accessed (e.g., `node-expand.no-selection-title`)
