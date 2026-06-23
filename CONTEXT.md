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
_Avoid_: Configuration (legacy term being phased out — previously bundled connection + schema + user preferences into one object)

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

**User Preferences**:
Display customizations per Vertex Type and Edge Type — shape, color, icon, line style, and display labels. Persisted and merged with Schema-discovered metadata to produce the final rendering.
_Avoid_: User styling, user settings

**Schema Sync**:
The process that queries the database to discover vertex types, edge types, and their attributes. Required before a user can explore a new Connection.
_Avoid_: Fetch, load

**Schema**:
The discovered structure of a connected graph database — vertex types, edge types, their attributes, and how they connect. Populated by Schema Sync when a Connection is first used; not user-defined.
_Avoid_: Model, structure

**Exported Connection File**:
The on-disk JSON format a user gets when they export a Connection (`saveConfigurationToFile`), and which import consumes. It bundles the connection config with a snapshot of the Schema (`lastUpdate` is an ISO string on disk). A single Zod schema in `parseConnectionFile.ts` is the source of truth: both the writer and the importer target the same inferred type (`ExportedConnectionFile`). The writer assigns a `Date` for `lastUpdate` and `JSON.stringify` serializes it to the ISO string; the parser coerces it back via `z.coerce.date()`. The schema is lenient (every level is a `looseObject`), so unknown and legacy fields — styling, `__inferred`/`__matches` on prefixes, attribute `dataType` — pass through untouched. It is intentionally decoupled from the in-memory configuration and from the IndexedDB storage shape, so the wire format can evolve independently. On import it is split — the connection lands in `configurationAtom`, the schema in `schemaAtom`.
_Avoid_: Configuration file (the wire format is not the in-memory or persisted shape)

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
- **User Preferences** are scoped per **Vertex Type** and **Edge Type**
- The **Graph View**, **Data Table View**, and **Schema View** all render from the same **Session** and **Schema**

## Example dialogue

> **Dev:** "When a user creates a new **Connection** and opens the **Graph View**, can they start exploring immediately?"
> **Domain expert:** "No — a **Schema Sync** has to complete first. Until the **Schema** is populated, we don't know what **Vertex Types** or **Edge Types** exist, so there's nothing to search or filter by."

> **Dev:** "If a user expands **Neighbors** on a vertex, do we fetch all connected vertices at once?"
> **Domain expert:** "No, it's progressive. We fetch one page at a time and track unfetched **Neighbor** counts so the user knows how much is left to explore."

> **Dev:** "Are **User Preferences** shared across **Connections**?"
> **Domain expert:** "No — well, actually right now they're per **Vertex Type** and **Edge Type** globally, not scoped to a specific **Connection**. So if two databases happen to have the same type name, they'd share styling."

## Flagged ambiguities

- "Configuration" was used to mean both **Connection** and the bundled object (connection + schema + user preferences) — resolved: **Connection** is canonical, "Configuration" is legacy.
- A Connection's data now has three distinct shapes that look similar but must not be conflated: the **Exported Connection File** (on-disk wire format), the in-memory configuration, and the IndexedDB storage shape. They are being separated into explicit types so each can evolve independently.
- "Node" means **Vertex** in code but is the preferred UI term for property graphs — resolved: use **Vertex** in code, "node" in UI copy.
- "Attribute" vs "Property" — resolved: **Property** is canonical, "attribute" is legacy code term being phased out.
- "Active connection" meant a single shared per-origin value, but the app consumed it as if it were per-tab — resolved: **Active Connection** is per-tab (sessionStorage), **Last Active Connection** is the shared persisted breadcrumb. The legacy `activeConfigurationAtom` / `active-configuration` key is reused as the breadcrumb.
