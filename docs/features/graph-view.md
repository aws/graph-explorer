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
- [**Styles panel**](#styles-panel) of node and edge display options (e.g., color, icon, the property to use for the displayed name), split across a Nodes tab and an Edges tab.
- [**Namespaces panel (RDF only)**](#namespace-panel) allows you to shorten the display of Resource URIs within the app based on auto-generated prefixes, commonly-used prefix libraries, or custom prefixes set by the user. Order of priority is set to Custom > Common > Auto-generated.

The active panel, the sidebar width, and which views are toggled on are remembered per browser tab, so two tabs can keep different sidebar and view setups side by side. When you reopen Graph Explorer after closing all tabs, it resumes the setup you most recently used.

### Search Panel

The Search UI provides two powerful ways to search and interact with your graph database:

#### Filter Search

- Enables faceted filtering of nodes based on:
  - Node labels (or rdf:type for RDF databases)
  - Node attribute values
- The **Node Label** and **Property** pickers support type-to-filter, so you can find one by typing part of its name instead of scrolling
- Supports partial text matching on the search term
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

### Styles Panel

The Styles panel holds node and edge styling behind two tabs: **Nodes** and **Edges**. As you edit a node or edge type, a live preview shows it exactly as it will appear on the canvas.

On the **Nodes** tab, each node type can be customized in a variety of ways.

- **Display label** allows you to change how the node label (or rdf:type) is represented
- **Display name attribute** allows you to choose the attribute on the node that is used to uniquely label the node in the graph visualization and search
- **Display description attribute** allows you to choose the attribute on the node that is used to describe the node in search
- **Icon** can be searched or paged through in the built-in Lucide library via the **Browse** button, or uploaded as a custom SVG/raster image.
- **Colors and borders** can be customized to visually distinguish from other node types

On the **Edges** tab, each edge type can be customized in a variety of ways.

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

The Table View lists the nodes or edges in your graph as rows. Use it to scan the data, filter and sort it, decide what shows in the Graph View, and export it to a file. Open it with the grid icon in the toolbar.

### Choose nodes or edges

The dropdown in the table header switches between nodes and edges. It reads "All Nodes" and "All Edges" for Gremlin, "All Nodes" and "All Relationships" for openCypher, and "All Resources" and "All Predicates" for SPARQL.

### Columns

Column headers use the terms of your connection's query language.

**Nodes**

| Gremlin | openCypher | SPARQL | Shows |
| --- | --- | --- | --- |
| Node Id | Node Id | Resource Id | The node's ID |
| Node Label | Node Label | Class | The node's label |
| Name | Name | Name | The display name from the Styles panel |
| Description | Description | Description | The display description from the Styles panel |
| Neighbors | Neighbors | Neighbors | How many neighbors the node has |

**Edges**

| Gremlin | openCypher | SPARQL | Shows |
| --- | --- | --- | --- |
| Edge Label | Relationship Type | Predicate | The edge's label |
| Source Id | Source Id | Source Id | The ID of the source node |
| Source Label | Source Label | Source Class | The label of the source node |
| Target Id | Target Id | Target Id | The ID of the target node |
| Target Label | Target Label | Target Class | The label of the target node |

Both tables also start with a Visibility column.

### Sort and filter

Select a column header to sort by it. Each column also has a filter box under its header. The Neighbors filter takes an integer and keeps the nodes with at least that many neighbors.

Rows that do not match a filter appear faded in the Graph View, so you can focus on a subset without losing the rest of the graph. A reset button appears in the table header while a sort or filter is active.

Long tables are paged. Use the controls at the bottom of the table to change the page and the page size.

### Show or hide elements

Use the eye icon in the Visibility column to hide a single node or edge from the Graph View, or show it again. This is separate from filtering, and hidden elements disappear instead of fading.

### Export

Select the export button in the table header to download the table as CSV or JSON. The export options let you:

- Choose which columns to include
- Keep the current filtering and sorting, or export every row
- Export only the current page
- Name the file

The table itself always shows every column. Column choice only applies to exports.
