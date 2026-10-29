# Coding Standards

These are the standards for code in Graph Explorer. They apply to every contributor, human or agent. The area guides at the end go deeper, and [REVIEW.md](REVIEW.md) says what blocks a pull request.

## How to read this file

- **Must** is required. Breaking a Must blocks a pull request only where it falls under an Important category in [REVIEW.md](REVIEW.md).
- **Prefer** and **Avoid** are defaults. Deviate when you can say why.
- Rules use no other modal words.
- The ADRs in [docs/adr/](docs/adr/) win over this file, and this file wins over the surrounding code. When surrounding code breaks a Must, fix it or flag it rather than copy it.

## Saved and exported data stays readable

- **Must** read every value an older release saved: persisted atoms, export files (connections, styling, graph), the default connection payload and environment variables. Users upgrade with that data in place, and a failed read loses their work.
- **Must** write files that older releases still read. Users share exports with people running other versions.
- **Must** add backward-compatibility tests when you change the shape of a persisted type, as [Backward compatibility for persisted data](docs/agents/testing.md#backward-compatibility-for-persisted-data) describes. The tests pin the old shape so a later change keeps reading it.
- **Must** fix the reader or writer when a `__fixtures__` golden file test fails, and add a new fixture for a new shape. A golden file records what an older build wrote, and editing it hides the break.

## Query templates

- **Must** build every Gremlin, openCypher and SPARQL string with the `query` template tag from `@/utils`. It keeps query text consistent, though it escapes nothing.
- **Must** interpolate values only as Query Fragments from that language's `fragments.ts`, with no quotes, backticks or angle brackets around them. The fragment escapes the value and brings its own delimiters.

  ```ts
  // Avoid: the template quotes a raw value, and nothing escapes it
  query`g.V().has('name', '${name}')`;

  // Prefer: the fragment escapes the value and adds its own quotes
  query`g.V().has('name', ${fragment.string(name)})`;
  ```

- **Must** write Gremlin that runs on TinkerPop 3.6.2 and as an HTTP string query. That is the oldest server version Graph Explorer supports, and it sends every query over HTTP as a string.
- **Must** make each limit bound the scan, not only the rows returned. A limit applied after a full scan still times out on a large graph.
- **Must** say in the pull request why a change to one connector, or to shared query code, changes behavior in another query language. The three connectors share one interface, and users expect the same result from each.

[docs/agents/connectors.md](docs/agents/connectors.md) has the rules for each language. The query ADRs in [docs/adr/](docs/adr/) record why: single-quoted Gremlin literals, openCypher identifier rules, refusing values no database can carry, SPARQL literal escaping and `FILTER EXISTS` conjunction.

## Performance on large graphs

- **Must** fetch or subscribe once per collection, not once per item. Per-item work grows with the graph, and a per-hook icon subscription once locked up the schema view at 10,000 vertex types.
- **Must** keep loops over graph- or schema-sized collections linear, with a `Map` or `Set` lookup in place of a nested scan. A quadratic loop that passes on test data stalls on a real graph.
- **Must** process graph- or schema-sized collections in a single pass without copying them; small fixed lists are exempt. Each extra pass or copy multiplies time and memory by the size of the graph.

## Browser-support baseline

- **Must** use only runtime APIs inside the browser floor in `packages/graph-explorer/.browserslistrc`, and check by hand the ones the tools miss, listed in [What nothing catches](docs/agents/browser-floor.md#what-nothing-catches). The build lowers syntax to the floor but adds no polyfills.
- **Must** keep imports of `devDependencies` to tests, scripts and build config. The release image installs only the proxy server's production dependencies, so a server import of a `devDependency` fails at startup.

## Principles

Correct behavior is necessary but not sufficient: structure counts too.

- **Avoid** accepting a messy implementation because it passes tests. The next change pays for the mess.
- **Avoid** building for needs nobody has today (YAGNI). Speculative code is still code to read, test and keep working.
- **Prefer** deep modules: a simple interface over a substantial implementation. Callers learn less, and the module hides more.
- **Prefer** restructurings that delete whole layers, branches or concepts over ones that rearrange them ("code judo"). Stopping at "a bit cleaner" leaves the complexity in place.
- **Prefer** direct, legible code over thin wrappers, identity abstractions and generic mechanisms that hide simple structure. Each extra layer is one more place a reader has to look.
- **Prefer** a dedicated helper, state machine or module for a new conditional or special case. Tangled into an unrelated flow, it makes both harder to follow.
- **Prefer** keeping feature logic in its feature module, and reusing the canonical helper over adding a near-duplicate to a shared module. Near-duplicates drift apart.
- **Avoid** serializing independent work, or leaving related state half-applied, when a more atomic structure is available. Serial work is slower, and half-applied state breaks when something interrupts it.
- **Avoid** pushing a file from under 1000 lines to over without saying why; extract a module instead. A file that size usually holds more than one concern.

## TypeScript

- **Prefer** `function` declarations for module-level functions: `function handleClick() {}`, not `const handleClick = () => {}`. A declaration reads as one at a glance; arrow functions inside a function body are fine.
- **Prefer** a named type alias over `ReturnType<typeof ...>` when one exists, such as `AppStore` over `ReturnType<typeof getAppStore>`. The name says what the type is.
- **Prefer** a branded type over a raw `string` or `number` for a value used as a lookup key or passed where a specific concept is expected: an ID, a node or edge label, a type name. The compiler then tells one kind of string from another.
- **Avoid** casting a bare string to a branded type; construct it with its creator function, such as `createVertexId()`. A cast skips the creator and hides the boundary.
- **Prefer** named domain types over `Record<string, unknown>`. A named type documents the shape and checks it.
- **Avoid** `any`, `unknown`, casts and optional fields where a precise type fits, and make the invariant explicit at the boundary instead of falling back silently. Each one turns the type check off for the code that follows.
- **Avoid** encoding uncertainty as adapters, defaults, optionals, spreads or catch blocks; resolve it into the contract the code owns. Each workaround passes the uncertainty on to every caller.

## Comments

- **Avoid** comments by default, and justify each one you add. Nothing checks a comment, so it goes stale when the code changes.
- **Prefer** a comment that records why over one that restates what the code does or how. The code already says that.
- **Prefer** a descriptive name over a comment that explains a vague one. The name goes with the symbol to every call site.
- **Prefer** JSDoc that states what a symbol does; it is the one place a comment says what. Editors show it wherever the symbol is used.
- **Prefer** the shortest comment that carries the point. Readers skim long comments.

## Errors and untrusted input

- **Must** parse untrusted input with Zod before using it: database data, imported files and connection links. Its shape is outside Graph Explorer's control, and an unchecked value reaches state or a query.
- **Must** let bad input fail the parse rather than `.catch()` it into a different valid value. A silent substitute hides the corruption and saves the wrong value.
- **Prefer** Zod at every other boundary too. The schema enforces the contract, and the type comes from it.
- **Prefer** throwing upward over catching and laundering an error locally. The caller knows what the failure means, and a local fallback hides it.
- **Must** identify an error with `instanceof` on its class, such as `instanceof DatabaseTimeoutError`, not by its `name`, its message or a raw code, unless the platform gives it no class, as with `AbortError`. Names and messages change without a type error.
- **Avoid** classifying a database error by HTTP status. Databases reuse one status for memory limits and throttling.

## Testing

- **Prefer** writing a failing test first, then the code that makes it pass. A test you saw fail proves it tests something.
- **Must** add or update tests for the code you change, even when nobody asked. Untested changes are where regressions come from.
- **Must** write tests that fail when the behavior they name regresses. Reviewers check by injecting that regression, and a test that stays green is a finding.
- **Prefer** asserting behavior over CSS classes, element types or layout. Those details break on harmless visual changes.

[docs/agents/testing.md](docs/agents/testing.md) covers where tests live, `DbState`, the factories and the patterns to copy.

## React

- **Avoid** manual `useMemo`, `useCallback` and `React.memo` unless profiling shows a need. The React Compiler already memoizes components and hooks.
- **Prefer** Jotai atoms for shared client state and TanStack Query for server state. One owner per kind of state keeps it from being fetched or stored twice.
- **Prefer** extending `Select` or `Combobox` over adding a new picker primitive. `Select` covers small lists and `Combobox` covers schema-sized ones, per [the Combobox ADR](docs/adr/20260814-base-ui-combobox-for-virtualized-search.md).
- **Prefer** a Zod schema with `z.infer` for a form's shape over declaring the shape twice. One declaration has nothing to drift from.

[docs/agents/react.md](docs/agents/react.md) covers React 19 patterns, concurrent rendering, components, state and forms.

## Styling and accessibility

- **Prefer** semantic color tokens such as `bg-primary` over palette scales such as `bg-brand-500`. A token names the role, so a theme change touches one place.
- **Avoid** `dark:` variant classes. Dark mode is planned to come through the semantic tokens.
- **Prefer** `data-*` variants for conditional styles. They follow the component's state attributes without extra class logic.
- **Prefer** semantic HTML, such as `<button>` and `<label>`, over ARIA on generic elements. Native elements bring keyboard and screen reader behavior with them.
- **Must** make every interactive element work from the keyboard. Some users have no pointer.

[docs/agents/design.md](docs/agents/design.md) covers color tokens and Tailwind conventions, and [Accessibility](docs/agents/react.md#accessibility) in the React guide covers primitives.

## Enforced by tooling

`vp lint` (oxlint, including the React Compiler rules and the type check), `vp fmt` (oxfmt) and Vitest check the rest. `pnpm checks` runs the first two and `pnpm test` runs Vitest. This file repeats none of their rules, so the `lint` and `fmt` blocks in [vite.config.ts](vite.config.ts) are the reference. When a rule here becomes a lint rule, delete it from this file in the same pull request.

## Area guides

- [docs/agents/browser-floor.md](docs/agents/browser-floor.md): supported browsers and how the build, types and lint enforce them
- [docs/agents/connectors.md](docs/agents/connectors.md): connectors, explorers, query templates and database errors
- [docs/agents/design.md](docs/agents/design.md): color tokens, dark mode policy and Tailwind conventions
- [docs/agents/documentation.md](docs/agents/documentation.md): writing user-facing docs
- [docs/agents/product.md](docs/agents/product.md): product overview, supported databases and architecture
- [docs/agents/react.md](docs/agents/react.md): components, hooks, state, forms and accessibility
- [docs/agents/schema.md](docs/agents/schema.md): schema storage, discovery and Jotai atoms
- [docs/agents/testing.md](docs/agents/testing.md): Vitest patterns, `DbState`, factories and backward compatibility
- [docs/adr/](docs/adr/): architecture decisions; check here before reopening a design choice
- [GLOSSARY.md](GLOSSARY.md): the domain terms
- [docs/development.md](docs/development.md): toolchain setup and the pinned pnpm and Node versions
