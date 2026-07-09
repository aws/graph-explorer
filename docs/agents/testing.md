# Testing

Vitest. Tests co-locate with source as `*.test.ts` (or `*.test.tsx` for component/hook tests) — no `__tests__/` dirs. Test utilities live in `@/utils/testing` (frontend) and `@shared/utils/testing` (primitives).

## Rules

- Use `renderHookWithState` for hooks, not `renderHook`
- Set up state with `DbState`, not manual atom wiring or `renderHookWithJotai`. When `DbState` can't express what a test needs, extend `DbState` — growing it is the intended path, not working around it.
- Mock only external systems (network, etc.); don't mock internal modules
- Constrained non-determinism: randomize everything the assertion doesn't depend on, pin only what it does. A flake on random data is an unpinned dependency — pin the field, don't narrow the factory.
- Assert full expected values with `toStrictEqual([...])`, not length checks plus per-index `toEqual`
- Test behavior, not implementation. Don't assert on CSS classes, element types, or layout — those break on harmless visual changes. A purely presentational component with no branching needs no test.
- `setupTests.ts` handles environment (UTC, en-US), mock cleanup, and a real localForage backend on `fake-indexeddb` (fresh per test). Don't re-do this setup; assume it.

## Key helpers (`@/utils/testing`)

- `DbState` — set up the persisted app state a test needs, then `renderHookWithState(useThing, state)`. Extend it when it lacks a capability.
- `createTestableVertex()` / `createTestableEdge()` — fluent builders: `.with({...})`, `.withSource()`, `.withTarget()`, `.withRdfValues()`, `.asVertex()`, `.asResult()`
- `createMockExplorer` / `FakeExplorer` — explorer test doubles
- SPARQL: `createUriValue`, `createLiteralValue`, `createQuadBindingsForEntities`, `createQuadSparqlResponse` (`sparqlHelpers.ts`)
- Gremlin/openCypher response builders: `graphsonHelpers.ts`, `ocHelpers.ts`
- `normalizeWithNoSpace` — normalize query strings before asserting
- Persistence: `PersistenceTab`, `readPersistedValue` (`persistence.ts`)
- `@shared/utils/testing` — primitives: `createRandomName`, `createRandomInteger`, `createRandomColor`, `createRandomUrlString`, …

## Patterns — copy from the real test, don't reinvent

These files are the canonical, always-current examples. Open the closest one and follow it:

- Hook + `DbState`: `src/core/StateProvider/displayVertex.test.ts`
- Query-string generation (Gremlin): `src/connector/gremlin/fetchNeighbors/oneHopTemplate.test.ts`; SPARQL: `src/connector/sparql/fetchNeighbors/oneHopNeighborsTemplate.test.ts`
- SPARQL response parsing: `src/connector/sparql/parseAndMapQuads.test.ts`
- Cross-tab persistence: `src/utils/testing/persistence.test.ts`
- Legacy persisted-shape handling: `src/utils/parseConnectionFile.test.ts`

Canonical hook test shape:

```typescript
import {
  DbState,
  createTestableVertex,
  renderHookWithState,
} from "@/utils/testing";

test("filters vertices by type", () => {
  const state = new DbState();
  state.addTestableVertexToGraph(
    createTestableVertex().with({ types: ["Person"] }),
  );
  state.filterVertexType("Person");

  const { result } = renderHookWithState(() => useFilteredVertices(), state);

  expect(result.current.filteredVertices).toHaveLength(1);
});
```

## When to run which command

Commands are in AGENTS.md.

- Small change: `pnpm checks`, plus `pnpm test <path>` for the area you touched
- Before a PR, or after touching shared utilities, core providers, or type definitions: `pnpm test`
- No associated tests (config or type-only change): `pnpm check:types`

## Special cases

- **`vi.doMock` + dynamic `import()`**: call `vi.resetModules()` in the test's own `beforeEach` (not global — it's expensive). See any test that swaps a module impl between cases.
- **Production behavior**: tests run `DEV=true`/`PROD=false`; override per-test with `vi.stubEnv("PROD", true)`.
- **Errors**: `await expect(fn()).rejects.toThrow("...")`.

## Backward compatibility for persisted data

Anything persisted to IndexedDB via localForage/Jotai may be reloaded in an older shape after a type change, silently breaking logic that assumes the new shape. So: **when you change the shape of a persisted type, add tests that exercise the old shape alongside the new** — old shape loads without error, consuming logic produces correct results for both, and old/new can coexist in a collection.

Group them in a dedicated `describe("backward compatibility: ...")` with a comment block stating the old shape, why the tests exist, and a "do not delete without confirming migration" warning. See `src/utils/parseConnectionFile.test.ts` or `src/core/StateProvider/graphViewLayout.test.ts` for worked examples.

Applies to any object type persisted via `atomWithLocalForage`. Triggers: removing/renaming a property, changing a property's type, adding a required property, or changing a property's semantics.
