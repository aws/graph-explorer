## React Version & Compiler

- This project uses React 19. `packages/graph-explorer/package.json` is the source of truth for the exact version, so don't name a minor version in docs
- Graph Explorer is a client-side SPA. It has no Server Components or Server Actions, and needs no `"use client"` directive
- React 19 APIs such as `useEffectEvent` and `<Activity>` are available. `src/modules/GraphViewer/GraphViewer.tsx` uses `<Activity>` to hide the empty state and the legend without unmounting them
- The React Compiler is enabled — it auto-memoizes components and hooks, so manual `useMemo`, `useCallback`, and `React.memo` are unnecessary in most cases and should be avoided unless profiling shows a specific need
- Official React docs: https://react.dev
- **`useVirtualizer` (`@tanstack/react-virtual`)**, used in `components/Combobox.tsx`, bails the compiler out because it can't verify the hook's internal mutation patterns. The `// eslint-disable-next-line react-compiler/incompatible-library` comment is a lint suppression only: the compiler output is the same with or without it, but deleting the comment fails `pnpm check:lint`. See `docs/adr/20260814-base-ui-combobox-for-virtualized-search.md`.

## React 19 patterns

- Accept `ref` as a normal prop. Don't use `forwardRef`
- A ref callback can return a cleanup function. Use it to attach observers and listeners, instead of pairing the ref with an effect
- Use `useEffectEvent` to read the latest value inside an effect without adding it to the dependencies

## Concurrent rendering

- Use `startTransition` for non-urgent updates, so input stays responsive
- Use `useDeferredValue` for expensive derived views. `src/components/Combobox.tsx`, `src/core/StateProvider/schema.ts` and `src/core/StateProvider/graphStyles.ts` do this
- When a `useActionState` action awaits, dispatch it inside `startTransition`. Otherwise the pending update shows the nearest `<Suspense>` fallback, and a button-level load can flash the page loader. Wrap the dispatch once in the component so every call site is safe. `src/modules/StyleImport/LoadStylesButton.tsx` and `src/routes/Settings/SaveStylesButton.tsx` show the pattern

## Components

- **Select vs. Combobox:** `Select`/`SelectField` wrap Radix and are for small, bounded option lists. `Combobox` wraps Base UI + TanStack Virtual and is for schema-sized or unbounded lists that need type-to-filter and virtualization. Don't introduce a third picker primitive — extend `Combobox` instead. See `docs/adr/20260814-base-ui-combobox-for-virtualized-search.md`.
- Build interactive primitives on Radix through the unified `radix-ui` package, not the scoped `@radix-ui/*` packages
- Follow shadcn/ui patterns without depending on it: copy the primitive into `src/components/` and adapt it
- Compose classes with `cn()` from `src/utils/cn.ts`. For conditional styles, use the `data-*` variants in `docs/agents/design.md`

## Accessibility

- Use semantic HTML first (`<button>`, `<nav>`, `<label>`). Reach for ARIA only when no native element fits
- Every interactive element must work from the keyboard. Prefer Radix or Base UI primitives over hand-rolled widgets

## General

- Prefer functional components with hooks over class components
- Keep components small, focused on single responsibility
- Avoid prop drilling - use context or state management
- Follow principle of least privilege for component props

## State

- Use Jotai atoms for shared client state. The schema atoms are described in `docs/agents/schema.md`
- Server state goes in TanStack Query
- Don't hand-roll loading state with a fetch inside `useEffect` when a query fits
- **Exception: vertex icons.** They resolve through the `core/icons/` registry, read via `useSyncExternalStore`, because a per-hook subscription scaled with vertex-type count and locked up the schema view at 10k types. Don't move icon resolution back into TanStack Query — see `docs/adr/20260813-icon-registry-not-react-query.md`

## Forms & validation

- Define a Zod schema and derive the type with `z.infer`. Don't declare the shape twice
- Default to plain React state. Use `react-hook-form` only when a form needs it. Today only `src/modules/SearchSidebar/QuerySearchTabContent.tsx` calls `useForm`, and it renders the form with the shared `Form` components in `src/components/Form.tsx`
- With `react-hook-form` and Zod 4, use `standardSchemaResolver` from `@hookform/resolvers/standard-schema`. `zodResolver` has compatibility issues with Zod 4
- When code reads `FormData`, parse it through a Zod schema instead of reading raw string fields

## Feature Modules

- Feature modules in `src/modules/` contain all related components, hooks, and utilities
- Each module exports its public API through an index file
- Modules should be self-contained with minimal dependencies on other modules
- `src/connections/` follows the same rule: import from `@/connections`, never a deep path. `storageAtoms.ts` and `activeConnectionStorage.ts` are the exceptions, to break an import cycle with the storage atoms. Inside `src/connections/`, import specific `@/core/...` paths, not the `@/core` barrel. Lint enforces both

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
