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

## Branded Types

The project uses branded types from `@/utils` for type safety. These prevent
accidental mixing of similar types at compile time.

| Type                | Creator Function             | Location                                |
| ------------------- | ---------------------------- | --------------------------------------- |
| `VertexId`          | `createVertexId()`           | `@/core/entities/vertex`                |
| `VertexType`        | `createVertexType()`         | `@/core/entities/vertex`                |
| `EdgeId`            | `createEdgeId()`             | `@/core/entities/edge`                  |
| `EdgeType`          | `createEdgeType()`           | `@/core/entities/edge`                  |
| `EdgeConnectionId`  | `createEdgeConnectionId()`   | `@/core/StateProvider/edgeConnectionId` |
| `ConfigurationId`   | `createNewConfigurationId()` | `@/core/ConfigurationProvider/types`    |
| `RenderedVertexId`  | `toRenderedVertexId()`       | `@/core/StateProvider/renderedEntities` |
| `RenderedEdgeId`    | `toRenderedEdgeId()`         | `@/core/StateProvider/renderedEntities` |

Always use the appropriate branded type instead of `string` when working with
these identifiers.

## Database Queries

- Use the `query` template tag from `@/utils` for all query strings (Gremlin,
  openCypher, SPARQL) to ensure consistent formatting
- For Gremlin queries, use `escapeString()` from `@/utils` to escape special
  characters in string literals
