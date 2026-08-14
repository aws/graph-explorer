## React Version & Compiler

- This project uses React 19
- The React Compiler is enabled — it auto-memoizes components and hooks, so manual `useMemo`, `useCallback`, and `React.memo` are unnecessary in most cases and should be avoided unless profiling shows a specific need
- When per-call memoization genuinely is needed, a hook must not build and return a closure that mutates its own captured cache — the `react-compiler/*` lint rules reject it. Put the cache in a plain `create*` factory and have the hook call it, as `core/StateProvider/styleDataResolvers.ts` does. The two-line hook is not a pointless wrapper: collapsing it back inline fails lint. The factory also ends up store-free and directly unit-testable.
- Official React docs: https://react.dev

## General

- Prefer functional components with hooks over class components
- Keep components small, focused on single responsibility
- Avoid prop drilling - use context or state management
- Follow principle of least privilege for component props

## Async state

- Server state goes in TanStack Query
- **Exception: vertex icons.** They resolve through the `core/icons/` registry, read via `useSyncExternalStore`, because a per-hook subscription scaled with vertex-type count and locked up the schema view at 10k types. Don't move icon resolution back into TanStack Query — see `docs/adr/20260813-icon-registry-not-react-query.md`

## Client state (Jotai)

- When a derivation is consumed by more than one hook or pipeline, define it as a derived atom so the store computes it once, rather than a hook each caller re-runs. `visibleVertexIdsAtom` is shared by `useRenderedVertices` and `useRenderedEdges` for exactly this reason; as a hook it ran the filter loop once per call site
- `atomFamily` never evicts unless you call `remove`/`setShouldRemove`, and nothing in this codebase does. Key a family on a stable branded ID, never on a freshly allocated object or array — the latter interns a new entry per recomputation that can never be reached again

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
