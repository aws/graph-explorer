# Graph Explorer

A React-based web application that lets users visually explore graph databases without writing queries. Connects to property graph and RDF databases over HTTP.

## Language

**Vertex**:
A node in the graph — an entity with an ID, one or more types, and attributes. Called "node" in the UI to match user expectations; called "vertex" in code to avoid collision with Node.js global types.
_Avoid_: Node (in code)

**Edge**:
A directed relationship between two vertices (source → target), with a type and optional attributes. Always directed in the data model regardless of graph type.
_Avoid_: Relationship, link

**Connection**:
A saved database profile — the URL, query engine, authentication settings, and proxy routing needed to reach a graph database. Users create and manage these in the UI.
_Avoid_: Configuration (legacy term being phased out — previously bundled connection + schema + Styles into one object)

**Active Connection**:
The one Connection a single browser tab is currently exploring — what the entire app reads to decide which Schema, Session, and queries are in play. Held per-tab (sessionStorage): it survives that tab's reload but dies with the tab, and one tab activating a Connection never changes another tab's Active Connection.
_Avoid_: Active configuration (legacy code term `activeConfigurationAtom`)

**Last Active Connection**:
A persisted, shared breadcrumb recording the most recently activated Connection across all tabs. Last-writer-wins; used only as the cold-start seed for a fresh tab's Active Connection, never read live by the app.
_Avoid_: Default connection (that is a separate new-user/notebook injection path)

**Query Language**:
The graph query protocol a Connection uses — one of Gremlin, openCypher, or SPARQL. Determines which Explorer is instantiated and implies the graph type (Gremlin/openCypher → property graph, SPARQL → RDF).
_Avoid_: Query engine (internal code name `queryEngine`, but UI says "Query Language")

**Vertex Type**:
A classification of vertices. The schema, styling, filtering, and exploration all operate at the type level. UI label varies by query language: "Node Label" (Gremlin/openCypher), "Class" (SPARQL).

**Edge Type**:
A classification of edges. UI label varies by query language: "Edge Label" (Gremlin), "Relationship Type" (openCypher), "Predicate" (SPARQL).

**Neighbors**:
Vertices directly connected to a given vertex (one hop away). Users "expand neighbors" to progressively discover the graph. Neighbor counts track total vs. unfetched to indicate how much remains unexplored.
_Avoid_: Connections (ambiguous with Connection)

**Session**:
The set of vertices and edges a user has loaded through exploration for a given Connection. Persisted to IndexedDB so users can close the browser and restore where they left off.
_Avoid_: State, workspace

**Graph View**:
The interactive canvas where vertices and edges are visualized using Cytoscape.js. Users explore the graph here by expanding neighbors and applying layouts. Nav label: "Graph".
_Avoid_: Graph Explorer (ambiguous with the product name)

**Data Table View**:
Tabular view of all vertices and edges currently in the Session, filterable by type. Complements the Graph View for structured browsing.
_Avoid_: Data Explorer (legacy route name)

**Schema View**:
Visual representation of the Schema — shows vertex types and their edge connections as a graph.
_Avoid_: Schema Explorer (legacy route name)

**Edge Connection**:
A schema-level pattern describing how two vertex types can be related via an edge type: sourceVertexType --[edgeType]--> targetVertexType. What the Schema View visualizes. Not an actual edge instance.
_Avoid_: Relationship (Gremlin UI term), Object Property (SPARQL UI term)

**Property**:
A key-value pair on a Vertex or Edge. UI label varies by query language: "Property" (Gremlin/openCypher), "Datatype Property" (SPARQL).
_Avoid_: Attribute (legacy code term being phased out)

**Styles**:
Display customizations per Vertex Type and Edge Type — shape, color, icon, line style, and display labels. Resolved through a **Styles Cascade** (highest precedence first): User Custom Styles → Shared Styles → App Default Styles. Persisted and merged with Schema-discovered metadata to produce the final rendering. The two specific instances are **Vertex Styles** and **Edge Styles**, each stored in IndexedDB as its own type-keyed Map per layer. Storage keys follow a `<layer>-<entity>-styles` convention.
_Avoid_: User Preferences, preferences, user styling, user settings (the `*Preferences*` code names — `VertexPreferencesStorageModel`, `userPreferences.ts`, `vertexPreferencesAtom` — are the legacy term being phased out); "customization" as a standalone noun

**Styles Cascade**:
The precedence stack that resolves which style value a vertex or edge type displays. From highest to lowest priority: (3) **User Custom Styles** — per-type edits made in the style dialogs, (2) **Shared Styles** — loaded from a file via Settings, (1) **App Default Styles** — hardcoded in the codebase (`defaultVertexPreferences` / `defaultEdgePreferences`). The layers below User Custom Styles (1–2) collectively are **Default Styles** — what a per-type "Reset to Default" restores to (it clears the user's edit, revealing the Shared or App Default beneath). The verb is **customize**; the UI shorthand is **custom styles** / **shared styles**.
_Avoid_: Imported Default Styles, imported defaults (the layer is **Shared Styles**); Effective styles (no separate atom), style overrides

**User Custom Styles**:
The highest-precedence layer in the Styles Cascade. Per-type edits a user makes in the vertex/edge style dialogs. Stored in `userVertexStylesAtom` (`Map<VertexType, VertexPreferencesStorageModel>`, key `"user-vertex-styles"`) and `userEdgeStylesAtom` (`Map<EdgeType, EdgePreferencesStorageModel>`, key `"user-edge-styles"`). Clearing these ("Reset Custom Styles" in Settings) reveals Shared Styles beneath.

**Shared Styles**:
The second-highest-precedence layer in the Styles Cascade (below User Custom, above App Default). Loaded from a styling file via the Settings → Styles screen. Stored in `sharedVertexStylesAtom` (key `"shared-vertex-styles"`) and `sharedEdgeStylesAtom` (key `"shared-edge-styles"`). Non-destructive to User Custom Styles — loading writes only this layer. Clearing these ("Reset Shared Styles" in Settings) falls through to App Default Styles. Named for their purpose: a user **saves** their styles to a file and others **load** it to get the same look.
_Avoid_: Imported Default Styles, imported defaults (renamed — "shared" names the purpose and reads better)

**App Default Styles**:
The lowest-precedence layer in the Styles Cascade. Hardcoded in the codebase as `defaultVertexPreferences` and `defaultEdgePreferences`. Not persisted — always available as the final fallback.

**Schema Sync**:
The process that queries the database to discover vertex types, edge types, and their attributes. Required before a user can explore a new Connection.
_Avoid_: Fetch, load

**Schema**:
The discovered structure of a connected graph database — vertex types, edge types, their attributes, and how they connect. Populated by Schema Sync when a Connection is first used; not user-defined.
_Avoid_: Model, structure

**Exported Connection File**:
The on-disk JSON format a user gets when they export a Connection (`saveConfigurationToFile`), and which import consumes. It bundles the connection config with a snapshot of the Schema (`lastUpdate` is an ISO string on disk). A single Zod schema in `parseConnectionFile.ts` is the source of truth: both the writer and the importer target the same inferred type (`ExportedConnectionFile`). The writer assigns a `Date` for `lastUpdate` and `JSON.stringify` serializes it to the ISO string; the parser coerces it back via `z.coerce.date()`. The schema is lenient (every level is a `looseObject`), so unknown and legacy fields — styling, `__inferred`/`__matches` on prefixes, attribute `dataType` — pass through untouched. It is intentionally decoupled from the in-memory configuration and from the IndexedDB storage shape, so the wire format can evolve independently. On import it is split — the connection lands in `configurationAtom`, the schema in `schemaAtom`.
_Avoid_: Configuration file (the wire format is not the in-memory or persisted shape)

**File Envelope**:
The shared `{ meta, data }` wrapper for typed JSON export files (`core/fileEnvelope/`). `meta.kind` discriminates the file type and `meta.version` is a single-integer format generation; `parseFileEnvelope` guards both — rejecting a wrong-kind file and one whose version is newer than the build supports — before the caller validates `data` per kind. The write contract (`createFileEnvelope`) also stamps diagnostic `timestamp`/`source`/`sourceVersion`; the read schema keeps only `kind`/`version` and strips the rest (along with any unknown field). Consumers today: **styling-export** and **graph-export**. The **Exported Connection File** is the outlier — it predates the envelope and is a flat shape, not wrapped in one.
_Avoid_: Header, wrapper, metadata block

**Persistence Status**:
The single, global state of whether the app's client-side data is safely written to IndexedDB — `idle | saving | failed`. One source of truth that the Persistence Status Indicator subscribes to. `idle` = nothing queued and everything durable (no separate "saved" state — visually identical to a fresh session). `saving` = at least one write queued or in flight, including retryable retries. `failed` = at least one terminal failure outstanding, carrying failure records for a drill-in detail view. Aggregated across all per-key write queues by precedence: any terminal → `failed`; else any in-flight → `saving`; else `idle`. A `failed` key clears on its next successful write; status returns to `idle` when no failure records remain. Deliberately **not** per-key: a failed write flips the whole status rather than naming which collection failed, because the user cannot act on an individual key (the storage layer retries on their behalf). Lives in a plain external store outside React/Jotai; the React edge bridges it via `useSyncExternalStore`.
_Avoid_: Save state (ambiguous with Session)

**Persistence Status Indicator**:
The UI element in the nav bar (after the page title) that renders Persistence Status. It surfaces only on `failed` — a standing danger "Changes not saved" button — and stays absent at `idle` and `saving`. Clicking it opens a dialog showing the raw failure records (key, reason, attempt count, last attempt, and the underlying error's name/message/cause) in a read-only JSON editor. The dialog offers to save the configuration to a file via `saveLocalForageToFile` (`core/StateProvider/localDb.ts`) when storage is full (quota) — IndexedDB is still readable then — but not when storage is inaccessible (private mode, blocked), since the database never opened and there is nothing to read. Recovery scope is retry (transient failures) plus that backup (terminal-quota failures) — it does not guarantee the write eventually lands.
_Avoid_: Save-status indicator

## Relationships

- Each browser tab has at most one **Active Connection**; different tabs may have different ones
- The **Last Active Connection** seeds a fresh tab's **Active Connection** on cold start only
- A **Connection** has exactly one **Query Language**
- A **Connection** has one **Schema**, populated by **Schema Sync**
- A **Schema** contains **Vertex Types**, **Edge Types**, and **Edge Connections**
- A **Vertex** has one or more **Vertex Types** and zero or more **Properties**
- An **Edge** connects exactly two **Vertices** (source → target), has one **Edge Type**, and zero or more **Properties**
- An **Edge Connection** links a source **Vertex Type** to a target **Vertex Type** via an **Edge Type**
- A **Session** belongs to a **Connection** and contains **Vertices** and **Edges**
- **Neighbors** are **Vertices** one hop away from a given **Vertex**
- **Styles** are scoped per **Vertex Type** (**Vertex Styles**) and **Edge Type** (**Edge Styles**)
- The **Graph View**, **Data Table View**, and **Schema View** all render from the same **Session** and **Schema**

## Example dialogue

> **Dev:** "When a user creates a new **Connection** and opens the **Graph View**, can they start exploring immediately?"
> **Domain expert:** "No — a **Schema Sync** has to complete first. Until the **Schema** is populated, we don't know what **Vertex Types** or **Edge Types** exist, so there's nothing to search or filter by."

> **Dev:** "If a user expands **Neighbors** on a vertex, do we fetch all connected vertices at once?"
> **Domain expert:** "No, it's progressive. We fetch one page at a time and track unfetched **Neighbor** counts so the user knows how much is left to explore."

> **Dev:** "Are **Styles** shared across **Connections**?"
> **Domain expert:** "No — well, actually right now they're per **Vertex Type** and **Edge Type** globally, not scoped to a specific **Connection**. So if two databases happen to have the same type name, they'd share styling."

## Flagged ambiguities

- "Configuration" was used to mean both **Connection** and the bundled object (connection + schema + Styles) — resolved: **Connection** is canonical, "Configuration" is legacy.
- "User Preferences" / "preferences" was used for display customizations, but the code is mid-migration to "styles" (`userVertexStylesAtom` / `userEdgeStylesAtom`, `"user-vertex-styles"` / `"user-edge-styles"`) — resolved: **Styles** is canonical (with **Vertex Styles** / **Edge Styles** as instances); the `*Preferences*` code names are legacy being phased out.
- "Imported Default Styles" / "imported defaults" named the cascade's middle layer, and its file actions were "Import" / "Export" — resolved: the layer is **Shared Styles** ("shared" names the purpose and reads better than a bare adjective-noun), and the actions are **Load** / **Save** to match the house style used by the graph and configuration file features. "Default" now lives only in the cascade generally and the per-type "Reset to Default" button, not the layer name. Renamed end-to-end (atoms `shared*StylesAtom`, keys `"shared-*-styles"`) since the feature had not shipped — no migration. The core-styling plumbing keeps `import`-flavored names (`parseStylingFile`, `useApplyStylingImport`, `getStylingConflicts`) as an internal detail of the load action.
- A Connection's data now has three distinct shapes that look similar but must not be conflated, each with its own explicit type: the **Exported Connection File** (`ExportedConnectionFile`, on-disk wire format), the in-memory merged configuration (`MergedConfiguration` — connection plus a live `Schema` with `lastUpdate` as a `Date`), and the persisted storage shape (`RawConfiguration` — connection only; the schema is stored separately in `schemaAtom`, never embedded). `mergeConfiguration` assembles a `MergedConfiguration` from a stored `RawConfiguration` and its active schema. Remaining work: `configurationAtom` still keys by `RawConfiguration`, to be migrated to a connection record.
- "Node" means **Vertex** in code but is the preferred UI term for property graphs — resolved: use **Vertex** in code, "node" in UI copy.
- "Attribute" vs "Property" — resolved: **Property** is canonical, "attribute" is legacy code term being phased out.
- "Active connection" meant a single shared per-origin value, but the app consumed it as if it were per-tab — resolved: **Active Connection** is per-tab (sessionStorage), **Last Active Connection** is the shared persisted breadcrumb. The legacy `activeConfigurationAtom` / `active-configuration` key is reused as the breadcrumb.
