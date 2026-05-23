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
