---
name: schema
description: Schema storage and discovery in Graph Explorer, including SchemaStorageModel persistence, edge connections, incremental schema growth, and related Jotai atoms.
tools: ["fs_read", "code", "grep", "glob", "web_search", "web_fetch"]
---

# Schema Storage

Schema discovery is expensive in both time and database compute, so the discovered schema is persisted in IndexedDB (via localforage) as a `SchemaStorageModel`. This acts as a persistent cache per connection.

Key files:

- `src/core/StateProvider/schema.ts` — `SchemaStorageModel` type, Jotai atoms, and incremental update logic
- `src/core/ConfigurationProvider/types.ts` — `EdgeConnection`, `VertexTypeConfig`, `EdgeTypeConfig`, and related types
- `src/hooks/useSchemaSync.ts` — schema sync orchestration
- `src/connector/queries/edgeConnectionsQuery.ts` — edge connection discovery

## Edge Connections

Edge connections (`EdgeConnection[]`) describe relationships between vertex types and are used by the Schema Explorer feature. Because the edge connection query can be expensive and unreliable, it runs separately from the main schema sync so that a failure only affects Schema Explorer — all other features work without edge connections.

The `edgeConnections` property on `SchemaStorageModel` has three meaningful states:

- `undefined` — edge connections have not been successfully discovered (query not run or errored)
- `[]` (empty array) — query succeeded but no edge connections exist
- populated array — query succeeded with results

If the edge connection query fails, the error is stored in the schema via the `edgeConnectionDiscoveryFailed` flag.

## Incremental Schema Growth

As users explore the graph, queries may return vertex/edge types or attributes not present in the initial schema sync. These are automatically merged into the stored schema via `updateSchemaFromEntities()`, causing the schema to grow more complete over time.
