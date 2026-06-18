---
name: typescript
description: TypeScript conventions and rules for Graph Explorer, including branded types, function style preferences, and type safety patterns.
---

# TypeScript Conventions

## General Rules

- Do not change the VS Code setting `typescript.autoClosingTags`
- Prefer named function syntax over anonymous arrow functions for module-level declarations (e.g., `function handleClick() {}` over `const handleClick = () => {}`). Arrow functions within function scope are fine.
- Every commit should have no type errors
- Use explicit type aliases instead of `ReturnType<typeof ...>` when available (e.g., use `AppStore` instead of `ReturnType<typeof getAppStore>`)

## Floating Promises

`typescript/no-floating-promises` is enabled as an error, so every unhandled promise must be marked explicitly. Pick the idiom by meaning:

- **`fireAndForget(promise)`** (from `@/utils`) — when a rejection is meaningful and should be observed even though you don't await it. It attaches `.catch(logger.error)`. This is the idiom for persisted-atom setters (`atomWithLocalForage`-backed writes), where a failed durable write should be logged rather than silently dropped.
- **bare `void expr;`** — when the rejection is genuinely inert or already handled elsewhere: aborted `navigate()`, a refetch whose errors surface through query state, a self-catching async helper, and test-state seeding.

See ADR `docs/adr/20260618-explicit-floating-promise-convention.md` for the full rationale.

## Branded Types

The project uses branded types from `@/utils` for type safety. These prevent accidental mixing of similar types at compile time.

| Type                     | Creator Function             | Location                                |
| ------------------------ | ---------------------------- | --------------------------------------- |
| `VertexId`               | `createVertexId()`           | `@/core/entities/vertex`                |
| `VertexType`             | `createVertexType()`         | `@/core/entities/vertex`                |
| `EdgeId`                 | `createEdgeId()`             | `@/core/entities/edge`                  |
| `EdgeType`               | `createEdgeType()`           | `@/core/entities/edge`                  |
| `EdgeConnectionId`       | `createEdgeConnectionId()`   | `@/core/StateProvider/edgeConnectionId` |
| `ConfigurationId`        | `createNewConfigurationId()` | `@/core/ConfigurationProvider/types`    |
| `RenderedVertexId`       | `toRenderedVertexId()`       | `@/core/StateProvider/renderedEntities` |
| `RenderedEdgeId`         | `toRenderedEdgeId()`         | `@/core/StateProvider/renderedEntities` |
| `IriNamespace`           | `splitIri()`                 | `@/utils/rdf`                           |
| `IriLocalValue`          | `splitIri()`                 | `@/utils/rdf`                           |
| `RdfPrefix`              | `generatePrefix()`           | `@/utils/rdf`                           |
| `NormalizedIriNamespace` | `normalizeNamespace()`       | `@/utils/rdf`                           |

Always use the appropriate branded type instead of `string` when working with these identifiers.
