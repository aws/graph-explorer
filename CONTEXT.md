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

## Relationships

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
