---
inclusion: always
---

# Project Organization

## Code Organization Patterns

### Feature Modules

- Feature modules in `src/modules/` contain all related components, hooks, and
  utilities
- Each module exports its public API through an index file
- Modules should be self-contained with minimal dependencies on other modules

### Connector Pattern

- Database connectors are separated by query language (gremlin, openCypher,
  sparql)
- Common interfaces are defined in `src/connector/index.ts`
- Each connector implements the same interface for consistent API

### Explorer Pattern

- "Explorers" abstract querying databases with different query languages
- Each explorer provides a unified interface for a specific query language
- Located in `src/connector/[query-language]/explorer/`
- Explorers handle query construction, execution, and result transformation
- They shield the application from query language specifics while providing
  consistent data structures

## Naming & File Conventions

- **React Components**: PascalCase (e.g., `GraphViewer.tsx`)
- **Component Folders**: PascalCase with index exports
- **Hooks**: camelCase with `use` prefix (e.g., `useGraphData.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Test Files**: Same name as source with `.test.ts` suffix
- **Type Definitions**: Use TypeScript interfaces or types with descriptive
  names

## Testing Approach

- Tests are co-located with source files (`*.test.ts` or `*.test.tsx`)
- Test utilities are in `src/utils/testing/` or `src/connector/testUtils/`
- Use Vitest for unit and integration tests
- Mock external dependencies and focus on component behavior

## Key Architectural Patterns

- **State Management**: Use Jotai atoms for global state
- **Data Fetching**: Use TanStack Query for remote data
- **Graph Rendering**: Cytoscape.js with custom layout plugins
- **Query Abstraction**: Explorers that provide unified interfaces for different
  query languages
- **Configuration**: Environment variables and configuration providers
- **Error Handling**: Error boundaries and consistent error display components
- **State Persistence**: localforage for client-side persistence using IndexedDB

## Data Storage & Persistence

- **Client-Side Only**: Graph Explorer stores all user data and preferences
  client-side
- **No Server Storage**: The backend proxy server does not store any user data
- **IndexedDB**: Used as the primary storage mechanism via localforage
- **Persistence Scope**:
  - User preferences and settings
  - Connection configurations
  - Query history
  - Visualization settings
  - Layout preferences
- **External Data**: Graph data is queried directly from the connected graph
  databases and is not owned or persisted by Graph Explorer

## Schema Storage

Schema discovery is expensive in both time and database compute, so the
discovered schema is persisted in IndexedDB (via localforage) as a
`SchemaStorageModel`. This acts as a persistent cache per connection.

Key files:

- `src/core/StateProvider/schema.ts` — `SchemaStorageModel` type, Jotai atoms,
  and incremental update logic
- `src/core/ConfigurationProvider/types.ts` — `EdgeConnection`,
  `VertexTypeConfig`, `EdgeTypeConfig`, and related types
- `src/hooks/useSchemaSync.ts` — schema sync orchestration
- `src/connector/queries/edgeConnectionsQuery.ts` — edge connection discovery

### Edge Connections

Edge connections (`EdgeConnection[]`) describe relationships between vertex
types and are used by the Schema Explorer feature. Because the edge connection
query can be expensive and unreliable, it runs separately from the main schema
sync so that a failure only affects Schema Explorer — all other features work
without edge connections.

The `edgeConnections` property on `SchemaStorageModel` has three meaningful
states:

- `undefined` — edge connections have not been successfully discovered (query
  not run or errored)
- `[]` (empty array) — query succeeded but no edge connections exist
- populated array — query succeeded with results

If the edge connection query fails, the error is stored in the schema via the
`edgeConnectionDiscoveryFailed` flag.

### Incremental Schema Growth

As users explore the graph, queries may return vertex/edge types or attributes
not present in the initial schema sync. These are automatically merged into the
stored schema via `updateSchemaFromEntities()`, causing the schema to grow more
complete over time.

## Branded Types

The project uses branded types from `@/utils` for type safety. These prevent
accidental mixing of similar types at compile time.

| Type               | Creator Function             | Location                                |
| ------------------ | ---------------------------- | --------------------------------------- |
| `VertexId`         | `createVertexId()`           | `@/core/entities/vertex`                |
| `VertexType`       | `createVertexType()`         | `@/core/entities/vertex`                |
| `EdgeId`           | `createEdgeId()`             | `@/core/entities/edge`                  |
| `EdgeType`         | `createEdgeType()`           | `@/core/entities/edge`                  |
| `EdgeConnectionId` | `createEdgeConnectionId()`   | `@/core/StateProvider/edgeConnectionId` |
| `ConfigurationId`  | `createNewConfigurationId()` | `@/core/ConfigurationProvider/types`    |
| `RenderedVertexId` | `toRenderedVertexId()`       | `@/core/StateProvider/renderedEntities` |
| `RenderedEdgeId`   | `toRenderedEdgeId()`         | `@/core/StateProvider/renderedEntities` |

Always use the appropriate branded type instead of `string` when working with
these identifiers.

## Translations (Query-Language Labels)

The translation system is not used for locale/language translations. Instead, it
swaps UI labels based on the active connection's query language. Each query
language (Gremlin, openCypher, SPARQL) has its own JSON file in
`src/hooks/translations/` that maps keys to display strings (e.g., `"node-type"`
→ `"Node Label"` in Gremlin vs `"Class"` in SPARQL).

Key files:

- `src/hooks/useTranslations.ts` — `useTranslations()` hook returns a `t`
  function scoped to the current query engine
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
- Keys typically match one of the query language terms or the codebase
  vocabulary
- Nested keys use dot notation when accessed (e.g.,
  `node-expand.no-selection-title`)

## Database Queries

- Use the `query` template tag from `@/utils` for all query strings (Gremlin,
  openCypher, SPARQL) to ensure consistent formatting
- For Gremlin queries, use `escapeString()` from `@/utils` to escape special
  characters in string literals
