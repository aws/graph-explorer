## React Version & Compiler

- This project uses React 19
- The React Compiler is enabled — it auto-memoizes components and hooks, so manual `useMemo`, `useCallback`, and `React.memo` are unnecessary in most cases and should be avoided unless profiling shows a specific need
- Official React docs: https://react.dev

## General

- Prefer functional components with hooks over class components
- Keep components small, focused on single responsibility
- Avoid prop drilling - use context or state management
- Follow principle of least privilege for component props

## Async state

- Server state goes in TanStack Query
- **Exception: vertex icons.** They resolve through the `core/icons/` registry, read via `useSyncExternalStore`, because a per-hook subscription scaled with vertex-type count and locked up the schema view at 10k types. Don't move icon resolution back into TanStack Query — see `docs/adr/20260813-icon-registry-not-react-query.md`
- **Exception: `useSearchableAttributes`'s internal `useMemo`** (`core/StateProvider/displayTypeConfigs.ts`). The compiler doesn't run under Vitest, so this memo is load-bearing for the test suite even though it would be redundant in the compiled production bundle. Don't remove it without also proving the referential-stability test in `useKeywordSearch.test.ts` still passes. Elsewhere, prefer stabilizing the _input_ to a memo (e.g. `useTranslations()`'s returned function is wrapped in `useCallback`) over adding more manual memos downstream of an unstable dependency
- **Exception: `useVirtualizer` (`@tanstack/react-virtual`)**, used in `components/Combobox.tsx`. It needs a `// eslint-disable-next-line react-compiler/incompatible-library` comment on the call — the compiler can't verify the hook's internal mutation patterns are safe to auto-memoize

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
