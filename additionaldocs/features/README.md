# Features Overview

If you are interested in where Graph Explorer is headed in the future then check
out our [roadmap](../../ROADMAP.md) and participate in the discussions.

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
Connections is accessible as the first screen after deploying the application,
when you click `Open Connections` on the top-right. Click `+` on the top-right
to add a new connection. You can also edit and delete connections.

- **Add a new connection:**

  - **Name:** Enter a name for your connection (e.g., `MyNeptuneCluster`).
  - **Graph Type:** Choose a graph data model that corresponds to your graph
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
  endpoint at a time. To select the active database, toggle the “Active” switch.

- **Connection Details:** Once a connection is created, this section will appear
  as a right-hand information pane for a selected connection. It shows details
  such as the connection name, graph data model type, endpoint and a summary of
  the graph data, such as the count of nodes, edges, and a list of node types.
- **Last Synchronization:** When a connection is created, Graph Explorer will
  perform a scan of the graph to provide summary data. To re-synchronize after
  data has changed on your graph, select a connection, and then click the
  “refresh” button next to “Last Synchronization” text.
- **Data Explorer UI:** Under a listed node type, you can click on the ‘>’ arrow
  to get to the “Data Explorer” view. This allows you to see a sample list of
  nodes under this type and choose one or more nodes to “Send to Explorer” for
  getting started quickly if you are new to the data.

## Graph Explorer UI

You can search, browse, expand, customize views of your graph data using Graph
Explorer, which is the main UI of this application. Once you create a
connection, you can click “Open Graph Explorer” on the top-right to navigate
here. There are several key features on this UI:

### Top Bar UI

- **Toggles:** You can toggle to show/hide the Graph View and/or Table View for
  screen real-estate management.
- **Open Connections:** This takes the user back to Connections UI.

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

### Right-hand Pane UI

The pane on the right of the graph provides various actions, configuration, and
details about the open graph.

- **Search View** allows you to search for specific nodes by filtering on node
  types and attributes and then adding nodes to the graph view.
- **Details View** shows details about a selected node/edge such as properties
  etc.
- **Entities Filter** is used to control the display of nodes and edges that are
  already expanded in the Graph View; click to hide or show nodes/edges.
- **Expand** is used when expanding will result in 10+ neighbors and control the
  meaningful expansion. You will need to select a number as the limit to expand
  to. You can also add text filters for expansion.
- **Node Styling** of node display options (e.g., color, icon, the property to
  use for the displayed name).
- **Edge Styling** of edge display options (e.g., color, icon, the property to
  use for the displayed name).
- **Namespaces (RDF only)** allows you to shorten the display of Resource URIs
  within the app based on auto-generated prefixes, commonly-used prefix
  libraries, or custom prefixes set by the user. Order of priority is set to
  Custom > Common > Auto-generated.

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

## Data Explorer UI

You can use the Data Explorer UI to view the data for the selected node type.
You can open the Data Explorer by clicking the node type row in the connection
details pane.

- View tabular data for the selected node type
- Set the node type display name and description attributes
- Send a specific node to the graph view
