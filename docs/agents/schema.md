# Schema Storage

Schema discovery is expensive in both time and database compute, so the discovered schema is persisted in IndexedDB (via localforage) as a `SchemaStorageModel`. This acts as a persistent cache per connection.

Key files:

- `src/core/StateProvider/schema.ts` — `SchemaStorageModel` type, Jotai atoms, and incremental update logic
- `src/core/ConfigurationProvider/types.ts` — `EdgeConnection`, `VertexTypeConfig`, `EdgeTypeConfig`, and related types
- `src/hooks/useSchemaSync.ts` — schema sync orchestration
- `src/connector/queries/edgeConnectionsQuery.ts` — edge connection discovery

## Edge Connections

Edge connections (`EdgeConnection[]`) describe relationships between vertex types and are used by the Schema View feature. Because the edge connection query can be expensive and unreliable, it runs separately from the main schema sync so that a failure only affects the Schema View — all other features work without edge connections.

The `edgeConnections` property on `SchemaStorageModel` has three meaningful states:

- `undefined` — edge connections have not been successfully discovered (query not run or errored)
- `[]` (empty array) — query succeeded but no edge connections exist
- populated array — query succeeded with results

If the edge connection query fails, the schema records only that it failed, via the boolean `lastEdgeConnectionSyncFail`. The error itself is not persisted, so after a reload the popover can offer Retry but cannot say why it failed.

`SchemaDiscoveryBoundary` gates only on the main schema sync, so the Schema View renders node types whether or not edge connections were discovered.

`SchemaGraphToolbar` renders `EdgeConnectionDiscoveryStatusButton`, a triangle icon button next to "Refresh Schema": warning color when discovery has not run, danger color when it failed. It opens a popover with Retry or Synchronize, plus Error Details when the current session has the error.

`edgeConnectionNotice(schema, error)` (in `src/hooks/edgeConnectionNotice.ts`, next to `useSchemaSync`) checks failure first (the live query error or `lastEdgeConnectionSyncFail`) and only then `edgeConnections == null`, because partial connections added by exploration after a failure must still report the failure. `useEdgeConnectionNotice()` wraps it with `useMaybeActiveSchema()` and `useSchemaSync().edgeDiscoveryQuery` so the toolbar button, the sidebar details, and the connection detail panel share one resolution of the notice.

## Incremental Schema Growth

As users explore the graph, queries may return vertex/edge types or attributes not present in the initial schema sync. These are automatically merged into the stored schema via `updateSchemaFromEntities()`, causing the schema to grow more complete over time.
