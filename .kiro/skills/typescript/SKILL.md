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

- **`.catch(logAndNotify(message, options?))`** (`logAndNotify` from `@/utils`) — when the user should know about the failure. Logs via `logger.warn` and shows a warning toast with `message`. This is the idiom for persisted-atom writes from a user action (saving a connection, editing a style, toggling a setting). Build the `message` with `useTranslations` when it references node/edge vocabulary so it reads correctly per query engine; pass `options` for sonner extras like `description`.
- **`.catch(logAndIgnore)`** (`logAndIgnore` from `@/utils`) — when a rejection is worth logging but not worth interrupting the user (e.g. a background canvas icon fetch). Logs via `logger.warn` only (warn, not error, since an ignored rejection is non-blocking).
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
