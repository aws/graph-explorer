# Graph Explorer UI

You can search, browse, expand, customize views of your graph data using Graph
Explorer, which is the main UI of this application. Once you create a
connection, you can click "Open Graph Explorer" on the top-right to navigate
here. There are several key features on this UI:

## Top Bar UI

- **Toggles:** You can toggle to show/hide the Graph View and/or Table View for
  screen real-estate management.
- **Open Connections:** This takes the user back to Connections UI.

## Graph View UI

The graph visualization canvas that you can interact with. Double-click to
expand the first-order neighbors of a node.

- **Layout drop-down & reset:** You can display graph data using standard graph
  layouts in the Graph View. You can use the circular arrow to reset the physics
  of a layout.
- **Screenshot:** Download a picture of the current window in Graph View.
- **Save Graph:** Save the current rendered graph as a JSON file that can be
  shared with others having the same connection or reloaded at a later time.
- **Load Graph:** Load a previously saved graph from a JSON file.
- **Zoom In/Out & Clear:** To help users quickly zoom in/out or clear the whole
  canvas in the Graph View.
- **Legend (i):** This displays an informational list of icons, colors, and
  display names available.

## Sidebar Panel UI

The panel on the right of the graph provides various actions, configuration, and
details about the open graph.

- [**Search panel**](#search-panel) allows you to search for specific nodes by
  filtering on node types & attributes or executing a database query then adding
  nodes & edges to the graph panel.
- [**Details panel**](#details-panel) shows details about a selected node/edge
  such as properties etc.
- [**Entities filter panel**](#entities-filter-panel) is used to control the
  display of nodes and edges that are already expanded in the Graph View; click
  to hide or show nodes/edges.
- [**Expand panel**](#expand-panel) provides controls and filters to help focus
  large neighbor expansions.
- [**Node styling panel**](#node-styling-panel) of node display options (e.g.,
  color, icon, the property to use for the displayed name).
- [**Edge styling panel**](#edge-styling-panel) of edge display options (e.g.,
  color, icon, the property to use for the displayed name).
- [**Namespaces panel (RDF only)**](#namespace-panel) allows you to shorten the
  display of Resource URIs within the app based on auto-generated prefixes,
  commonly-used prefix libraries, or custom prefixes set by the user. Order of
  priority is set to Custom > Common > Auto-generated.

### Search Panel

Graph Explorer Search UI provides two powerful ways to search and interact with
your graph database:

#### Filter Search

- Enables faceted filtering of nodes based on:
  - Node labels (or rdf:type for RDF databases)
  - Node attribute values
- Supports partial text matching
- Search results can be added to the graph individually or all at once
- Supports cancellation of long-running queries

#### Query Search

- Available for Gremlin and openCypher connections
- Allows execution of any valid database query, including mutations
- When adding an edge, its connected nodes are automatically included
- Displays scalar values in results (though these cannot be added to the graph)
- Paginates large result sets
- Results can be added to the graph individually or all at once
- Supports cancellation of long-running queries

### Details Panel

- Displays attributes and values for node or edge selections
- Displays neighbor counts by label for node selections
- Displays relationship information for edge selections

### Expand Panel

Provides fine grained control over neighbor expansions

- Filter by node label (or rdf:type for RDF databases)
- Filter by attribute value
- Limit results to a maximum size

### Entities Filter Panel

Provides the ability to filter nodes or edges from the visualization by label
(or rdf:type for RDF databases)

### Node Styling Panel

Each node type can be customized in a variety of ways.

- **Display label** allows you to change how the node label (or rdf:type) is
  represented
- **Display name attribute** allows you to choose the attribute on the node that
  is used to uniquely label the node in the graph visualization and search
- **Display description attribute** allows you to choose the attribute on the
  node that is used to describe the node in search
- **Custom symbol** can be uploaded in the form of an SVG icon
- **Colors and borders** can be customized to visually distinguish from other
  node types

### Edge Styling Panel

Each edge type can be customized in a variety of ways.

- **Display label** allows you to change how the edge label (or predicate in RDF
  databases) is represented
- **Display name attribute** allows you to choose the attribute on the edge that
  is used to uniquely label the edge in the graph visualization and search
- **Arrow symbol** can be chosen for both source and target variations
- **Colors and borders** can be customized for the edge label and the line
- **Line style** can be solid, dotted, or dashed

### Namespace Panel

- Only visible in RDF connections
- Displays any automatically generated namespace prefixes for the connection
- Displays all the common prefixes that are built-in
- Allows creation and management of any custom namespace prefixes
