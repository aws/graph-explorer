# Testing

Vitest. Tests co-locate with source as `*.test.ts` (or `*.test.tsx` for component/hook tests) — no `__tests__/` dirs. Test utilities live in `@/utils/testing` (frontend) and `@shared/utils/testing` (primitives).

## Where tests live

Vitest collects only the projects listed in the root `vitest.config.ts`, currently just `packages/*`. A test file outside those is never collected, and `pnpm test` still reports green, so adding a new top-level test directory means giving it a `vitest.config.ts` and adding it to that list.

Each project sets up its own environment. `setupTests.ts` below is registered by `packages/graph-explorer` only. `packages/graph-explorer-proxy-server` has its own setup file, and `packages/shared` has none, so its tests reset their own mocks.

## Rules

- Use `renderHookWithState` for hooks, not `renderHook`
- Set up state with `DbState`, not manual atom wiring or `renderHookWithJotai`. When `DbState` can't express what a test needs, extend `DbState` — growing it is the intended path, not working around it.
- Mock only external systems (network, etc.); don't mock internal modules
- Constrained non-determinism: randomize everything the assertion doesn't depend on, pin only what it does. A flake on random data is an unpinned dependency — pin the field, don't narrow the factory.
- Assert full expected values with `toStrictEqual([...])`, not length checks plus per-index `toEqual`
- Test behavior, not implementation. Don't assert on CSS classes, element types, or layout — those break on harmless visual changes. A purely presentational component with no branching needs no test.
- `setupTests.ts` handles environment (UTC, en-US), mock cleanup, and a real localForage backend on `fake-indexeddb` (fresh per test). Don't re-do this setup; assume it inside `packages/graph-explorer`.

## Key helpers (`@/utils/testing`)

- `DbState` — set up the persisted app state a test needs, then `renderHookWithState(useThing, state)`. Extend it when it lacks a capability.
- `createTestableVertex()` / `createTestableEdge()` — fluent builders: `.with({...})`, `.withSource()`, `.withTarget()`, `.withRdfValues()`, `.asVertex()`, `.asResult()`
- `createMockExplorer` / `FakeExplorer` — explorer test doubles
- `mockVirtualizedLayout` — give jsdom/happy-dom elements a measurable size so a virtualizer renders rows; see **jsdom/happy-dom layout** under Special cases
- SPARQL: `createUriValue`, `createLiteralValue`, `createQuadBindingsForEntities`, `createQuadSparqlResponse` (`sparqlHelpers.ts`)
- Gremlin/openCypher response builders: `graphsonHelpers.ts`, `ocHelpers.ts`
- `normalizeWithNoSpace` / `normalize` / `normalizeWithNewlines` — normalize query strings before asserting (`normalize.ts`). They differ in whitespace and comment handling; use whichever the file you're editing already uses.
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
- **jsdom/happy-dom layout**: jsdom and happy-dom never lay out elements, so `offsetHeight`/`offsetWidth` are always `0`. A component that measures its own size (e.g. a virtualizer deciding which rows are visible) will render as empty, and the failure looks like a component bug rather than an environment limitation. Call `mockVirtualizedLayout` in a `beforeEach` — it mocks `offsetHeight`/`offsetWidth` to read the element's own inline style, falling back to a fixed size, so real measurements are distinguishable from unmeasured ones.
- **Runtime features newer than the browser floor**: to cover the path taken by a browser that lacks a global or method, delete the property reflectively and restore it in a `finally` — `Object.getOwnPropertyDescriptor` plus `Reflect.deleteProperty`. Don't write the typed reference (`Error.isError`), which stops compiling as soon as `lib` excludes the feature. See `withoutErrorIsError` in `src/utils/createErrorDetails.test.ts`.
- **Errors**: assert the full error, not just that one was thrown. `expect(() => fn()).toThrow(new FooError(a, b))` — or `await expect(fn()).rejects.toThrow(new FooError(a, b))` for a rejected promise — deep-compares every property, so a wrong field fails the test. Prefer this over `toThrow(FooError)` (type only) or `toThrow("message")` (message only), which pass even when the code built the error with the wrong data. No need to catch the error and assert fields separately — the instance form already covers them.

## Proxy server: asserting outbound fetches

`packages/graph-explorer-proxy-server` mocks `node-fetch` globally and resets it in `beforeEach`. Assert what the proxy sent by matching the request URL and expecting exactly one call, never by call index:

```ts
const fetchOptions = fetchOptionsFor("sparql"); // filters mock.calls by URL
expect(fetchOptions.headers["User-Agent"]).toBe("graph-explorer/1.2.3");
```

`mock.calls[0]` is wrong here even though the reset makes it look safe. When a client abandons a request the proxy cancels the query from the `res` close handler, and that fetch is dispatched by socket death rather than by the request finishing, so it can be recorded after the test that caused it. It then lands in slot 0 for whichever test runs next. Positive `toHaveBeenCalledWith(url, …)` assertions are already immune. A negative assertion needs scoping to the URL it cares about, because a bare `not.toHaveBeenCalled()` fails on any stray call.

A test that deliberately abandons a request should await the cancellation before it ends, rather than leaving it in flight for the next test.

## Proxy server: running the Docker entrypoint

`createEntrypointWorkDir()` and `runEntrypoint()` in `packages/graph-explorer-proxy-server/src/testing.ts` run the real `docker-entrypoint.sh` in a temp directory. They stub `setup-ssl.sh`, which records that it ran and fails without `HOST`, and they replace the node start line with a node process that writes its environment to a file. `readServerEnvironment()` returns that environment, including the variables the entrypoint sets on the start line. `process-environment.sh` is a no-op stub unless the test copies the real script in.

`docker-entrypoint.test.ts` covers the entrypoint on its own. `config-pipeline.test.ts` runs each deployment scenario through the entrypoint, dotenv precedence, the Zod schema, and `resolveServerConfig`. Add a row to its table for a new deployment case. A row can set `readOnly` to mount the configuration folder or a file in it read-only, and expect `cannotWrite(file)`, a refusal that leaves the folder untouched.

## Backward compatibility for persisted data

Anything persisted to IndexedDB via localForage/Jotai may be reloaded in an older shape after a type change, silently breaking logic that assumes the new shape. So: **when you change the shape of a persisted type, add tests that exercise the old shape alongside the new** — old shape loads without error, consuming logic produces correct results for both, and old/new can coexist in a collection.

Group them in a dedicated `describe("backward compatibility: ...")` with a comment block stating the old shape, why the tests exist, and a "do not delete without confirming migration" warning. See `src/utils/parseConnectionFile.test.ts` or `src/core/StateProvider/graphViewLayout.test.ts` for worked examples.

Applies to any object type persisted via `atomWithLocalForage`. Triggers: removing/renaming a property, changing a property's type, adding a required property, or changing a property's semantics.

The same pinning applies outside IndexedDB: legacy environment variables that older deployments still set, and legacy on-disk configuration files that older exports or lifecycle scripts still produce, deserve the same dedicated `describe("backward compatibility: ...")` treatment. See `packages/graph-explorer-proxy-server/src/process-environment.test.ts` for the environment-variable case.
