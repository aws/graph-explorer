[← Features](./)

# Graph View

You can search, browse, expand, customize views of your graph data using the Graph view, which is the main view of this application. Once you create a connection, you can click "Graph" in the navigation bar to navigate here.

- **Toggle view visibility** The graph and table views can be hidden to allow the other to expand.

## Graph Canvas

The graph visualization canvas that you can interact with. Double-click to expand the first-order neighbors of a node.

- **Layout drop-down & reset:** You can display graph data using standard graph layouts in the Graph View. You can use the circular arrow to reset the physics of a layout.
- **Screenshot:** Download a picture of the current window in Graph View.
- **Save Graph:** Save the current rendered graph as a JSON file that can be shared with others having the same connection or reloaded at a later time.
- **Load Graph:** Load a previously saved graph from a JSON file.
- **Zoom In/Out & Clear:** To help users quickly zoom in/out or clear the whole canvas in the Graph View.
- **Legend (i):** This displays an informational list of icons, colors, and display names available.

## Sidebar Panels

The panel on the right of the graph provides various actions, configuration, and details about the open graph.

- [**Search panel**](#search-panel) allows you to search for specific nodes by filtering on node types & attributes or executing a database query then adding nodes & edges to the graph panel.
- [**Details panel**](#details-panel) shows details about a selected node/edge such as properties etc.
- [**Entities filter panel**](#entities-filter-panel) is used to control the display of nodes and edges that are already expanded in the Graph View; click to hide or show nodes/edges.
- [**Expand panel**](#expand-panel) provides controls and filters to help focus large neighbor expansions.
- [**Node styling panel**](#node-styling-panel) of node display options (e.g., color, icon, the property to use for the displayed name).
- [**Edge styling panel**](#edge-styling-panel) of edge display options (e.g., color, icon, the property to use for the displayed name).
- [**Namespaces panel (RDF only)**](#namespace-panel) allows you to shorten the display of Resource URIs within the app based on auto-generated prefixes, commonly-used prefix libraries, or custom prefixes set by the user. Order of priority is set to Custom > Common > Auto-generated.

### Search Panel

The Search UI provides two powerful ways to search and interact with your graph database:

#### Filter Search

- Enables faceted filtering of nodes based on:
  - Node labels (or rdf:type for RDF databases)
  - Node attribute values
- Supports partial text matching
- Search results can be added to the graph individually or all at once
- Supports cancellation of long-running queries

#### Query Search

- Allows execution of any valid database query, including mutations
- When adding an edge, its connected nodes are automatically included
- Displays scalar values in results (though these cannot be added to the graph)
- Paginates large result sets
- Results can be added to the graph individually or all at once
- Supports cancellation of long-running queries
- Some limitations exist for SPARQL queries
  - No support for `INSERT` and `DELETE` queries
  - No support for blank node results
  - `SELECT` queries only returns scalar values, even for resource URIs

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

Provides the ability to filter nodes or edges from the visualization by label (or rdf:type for RDF databases)

### Node Styling Panel

Each node type can be customized in a variety of ways.

- **Display label** allows you to change how the node label (or rdf:type) is represented
- **Display name attribute** allows you to choose the attribute on the node that is used to uniquely label the node in the graph visualization and search
- **Display description attribute** allows you to choose the attribute on the node that is used to describe the node in search
- **Icon** can be picked from the built-in Lucide library via the **Browse** button, or uploaded as a custom SVG/raster image.
- **Colors and borders** can be customized to visually distinguish from other node types
- **Reset to Default** restores this node type's styling. If a styling file has been imported via Settings, the imported values for this type are restored; otherwise the application's hardcoded defaults are used.

### Edge Styling Panel

Each edge type can be customized in a variety of ways.

- **Display label** allows you to change how the edge label (or predicate in RDF databases) is represented
- **Display name attribute** allows you to choose the attribute on the edge that is used to uniquely label the edge in the graph visualization and search
- **Arrow symbol** can be chosen for both source and target variations
- **Colors and borders** can be customized for the edge label and the line
- **Line style** can be solid, dotted, or dashed

### Namespace Panel

- Only visible in RDF connections
- Displays any automatically generated namespace prefixes for the connection
- Displays all the common prefixes that are built-in
- Allows creation and management of any custom namespace prefixes

## Table View

This collapsible view shows a row-column display of the data in the Graph View. You can use filters in the Table to show/hide elements in the Graph View, and you can export the table view into a CSV or JSON file.

The following columns are available for filtering on property graphs (RDF graphs in parentheses):

- Node ID (Resource URI)
- Node Type (Class)
- Edge Type (Predicate)
- Source ID (Source URI)
- Source Type (Source Class)
- Target ID (Target URI)
- Target Type (Target Class)
- Display Name - Set in the Node/Edge Styling panes
- Display Description - Set in the Node/Edge Styling panes
- Total Neighbors - Enter an integer to be used as the >= limit

### Additional Table View Features

- **Visibility** - manually show or hide nodes or edges
- **All Nodes / All Edges (or All Resources / All Predicates) dropdown** - allows you to display a list of either nodes or edges and control display/filter on them
- **Download** - You can download the current Table View as a CSV or JSON file with additional customization options
- **Default columns** - You can set which columns you want to display
- Paging of rows
