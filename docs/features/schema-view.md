[← Features](./)

# Schema View

The Schema view visualizes the schema of your graph database as an interactive graph. Node types are displayed as nodes and their relationships (edge connections) are displayed as edges between them.

You can open the Schema view by clicking "Schema" in the navigation bar.

- View all node types and their relationships as a graph
- Select a node type to view its properties and data types
- Select an edge connection to view its source type, edge type, and target type
- Choose from multiple graph layout algorithms
- Take a screenshot of the schema graph

## Sidebar

The sidebar has three panels:

- **Details** — shows properties and connections for the selected node type or edge connection
- **Node Styling** — customize colors and icons for node types
- **Edge Styling** — customize colors for edge types

Click the active tab icon to collapse the sidebar to just the icon strip. Click any tab icon to reopen it. Both the active tab and sidebar width are remembered across sessions.

The Details panel header includes an "Automatically open on selection" toggle. When enabled (the default), selecting a single node type or edge connection in the schema graph automatically opens the Details panel — so while it is enabled, a collapsed sidebar reopens on your next selection.

> [!NOTE]
>
> The schema and data types shown in the Schema view are inferred from samples of nodes and edges returned by queries. They may not be 100% accurate or complete, especially for large or diverse datasets. As you explore more data, the schema will grow more complete over time.
