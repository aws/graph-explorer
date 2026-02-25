# Features

If you are interested in where Graph Explorer is headed in the future then check
out our [roadmap](../../ROADMAP.md) and
[participate in the discussions](https://github.com/aws/graph-explorer/discussions).

## Settings UI

### General Settings

- **Default Neighbor Expansion Limit:** This setting will allow you to enable or
  disable the default limit applied during neighbor expansion. This applies to
  both double click expansion and the expand sidebar. This setting can be
  overridden by a similar setting on the connection itself.
- **Save Configuration:** This action will export all the configuration data
  within the Graph Explorer local database. This will not store any data from
  the connected graph databases. However, the export may contain the shape of
  the schema for your databases and the connection URL.
- **Load Configuration:** This action will replace all the Graph Explorer
  configuration data you currently have with the data in the provided
  configuration file. This is a destructive act and can not be undone. It is
  **strongly** suggested that you perform a **Save Configuration** action before
  performing a **Load Configuration** action to preserve any existing
  configuration data.

### About

In the _About_ page you can see the version number and submit any feedback.

## Connections UI

You can create and manage connections to graph databases using this feature.
Connections is accessible as the first screen after deploying the application or
by clicking `Connections` in the navigation bar. Click `+` on the top-right to
add a new connection. You can also edit and delete connections.

- **Add a new connection:**
  - **Name:** Enter a name for your connection (e.g., `MyNeptuneCluster`).
  - **Query Language:** Choose a query language that corresponds to your graph
    database.
  - **Public or proxy endpoint:** Provide the publicly accessible endpoint URL
    for a graph database, e.g., Gremlin Server. If connecting to Amazon Neptune,
    then provide a proxy endpoint URL that is accessible from outside the VPC,
    e.g., EC2.
    - **Note:** For connecting to Amazon Neptune, ensure that the graph
      connection URL is in the format `https://[NEPTUNE_ENDPOINT]:8182`, and
      that the proxy endpoint URL is either `https://[EC2_PUBLIC_HOSTNAME]:443`
      or `http://[EC2_PUBLIC_HOSTNAME]:80`, depending on the protocol used.
      Ensure that you don't end either of the URLs with `/`.
  - **Using proxy server:** Check this box if using a proxy endpoint.
  - **Graph connection URL:** Provide the endpoint for the graph database
  - **AWS IAM Auth Enabled:** Check this box if connecting to Amazon Neptune
    using IAM Auth and SigV4 signed requests
  - **Service Type:** Choose the service type
  - **AWS Region:** Specify the AWS region where the Neptune cluster is hosted
    (e.g., us-east-1)
  - **Fetch Timeout:** Specify the timeout for the fetch request
  - **Neighbor Expansion Limit:** Specify the default limit for neighbor
    expansion. This will override the app setting for neighbor expansion.

- **Available Connections:** Once a connection is created, this section will
  appear as a left-hand pane. When you create more than one connection to a
  graph database, you can only connect to and visualize from one graph database
  endpoint at a time. To select the active database, toggle the "Active" switch.

- **Connection Details:** Once a connection is created, this section will appear
  as a right-hand information pane for a selected connection. It shows details
  such as the connection name, query language, endpoint and a summary of the
  graph data, such as the count of nodes, edges, and a list of node types.
- **Last Synchronization:** When a connection is created, Graph Explorer will
  perform a scan of the graph to provide summary data. To re-synchronize after
  data has changed on your graph, select a connection, and then click the
  "refresh" button next to "Last Synchronization" text.
- **Data Table:** Under a listed node type, you can click on the ">" arrow to
  get to the "Data Table" view. This allows you to see a sample list of nodes
  under this type and choose one or more nodes to "Send to Explorer" for getting
  started quickly if you are new to the data. You can also navigate directly to
  the Data Table view using the "Data Table" link in the navigation bar.

## Graph View

You can search, browse, expand, customize views of your graph data using the
Graph view, which is the main view of this application. Once you create a
connection, you can click "Graph" in the navigation bar to navigate here. There
are several key features on this UI:

- **Toggle view visibility** The graph and table views can be hidden to allow
  the other to expand.

### Graph View UI

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

### Sidebar Panel UI

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

#### Search Panel

The Search UI provides two powerful ways to search and interact with your graph
database:

##### Filter Search

- Enables faceted filtering of nodes based on:
  - Node labels (or rdf:type for RDF databases)
  - Node attribute values
- Supports partial text matching
- Search results can be added to the graph individually or all at once
- Supports cancellation of long-running queries

##### Query Search

- Allows execution of any valid database query, including mutations
- When adding an edge, its connected nodes are automatically included
- Displays scalar values in results (though these cannot be added to the graph)
- Paginates large result sets
- Results can be added to the graph individually or all at once
- Supports cancellation of long-running queries
- Some limitations exist for SPARQL queries
  - No support for `INSERT` and `DELETE` queries
  - No support for synthetically generated RDF from `CONSTRUCT` queries
  - No support for blank node results
  - `SELECT` queries only returns scalar values, even for resource URIs

#### Details Panel

- Displays attributes and values for node or edge selections
- Displays neighbor counts by label for node selections
- Displays relationship information for edge selections

#### Expand Panel

Provides fine grained control over neighbor expansions

- Filter by node label (or rdf:type for RDF databases)
- Filter by attribute value
- Limit results to a maximum size

#### Entities Filter Panel

Provides the ability to filter nodes or edges from the visualization by label
(or rdf:type for RDF databases)

#### Node Styling Panel

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

#### Edge Styling Panel

Each edge type can be customized in a variety of ways.

- **Display label** allows you to change how the edge label (or predicate in RDF
  databases) is represented
- **Display name attribute** allows you to choose the attribute on the edge that
  is used to uniquely label the edge in the graph visualization and search
- **Arrow symbol** can be chosen for both source and target variations
- **Colors and borders** can be customized for the edge label and the line
- **Line style** can be solid, dotted, or dashed

#### Namespace Panel

- Only visible in RDF connections
- Displays any automatically generated namespace prefixes for the connection
- Displays all the common prefixes that are built-in
- Allows creation and management of any custom namespace prefixes

### Table View UI

This collapsible view shows a row-column display of the data in the Graph View.
You can use filters in the Table to show/hide elements in the Graph View, and
you can export the table view into a CSV or JSON file.

The following columns are available for filtering on property graphs (RDF graphs
in parentheses):

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

#### Additional Table View UI Features

- **Visibility** - manually show or hide nodes or edges
- **All Nodes / All Edges (or All Resources / All Predicates) dropdown** -
  allows you to display a list of either nodes or edges and control
  display/filter on them
- **Download** - You can download the current Table View as a CSV or JSON file
  with additional customization options
- **Default columns** - You can set which columns you want to display
- Paging of rows

## Data Table View

You can use the Data Table view to view the data for the selected node type. You
can open the Data Table view by clicking "Data Table" in the navigation bar or
by clicking the node type row in the connection details pane.

- Select a node type from the dropdown to view its data
- View tabular data for the selected node type
- Set the node type display name and description attributes
- Export the current table data to a CSV or JSON file
- Send a specific node to the graph view

## Schema View

The Schema view visualizes the schema of your graph database as an interactive
graph. Node types are displayed as nodes and their relationships (edge
connections) are displayed as edges between them.

You can open the Schema view by clicking "Schema" in the navigation bar.

- View all node types and their relationships as a graph
- Select a node type to view its properties and data types
- Select an edge connection to view its source type, edge type, and target type
- Choose from multiple graph layout algorithms
- Take a screenshot of the schema graph

> [!NOTE]
>
> The schema and data types shown in the Schema view are inferred from samples
> of nodes and edges returned by queries. They may not be 100% accurate or
> complete, especially for large or diverse datasets. As you explore more data,
> the schema will grow more complete over time.
