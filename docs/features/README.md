# Features

Graph Explorer provides a visual interface for exploring and analyzing graph data without writing queries.

## Feature Highlights

### Multiple Query Languages

Graph Explorer supports property graphs via [Gremlin](https://tinkerpop.apache.org/gremlin.html) and [openCypher](https://opencypher.org), as well as RDF graphs via [SPARQL](https://www.w3.org/TR/sparql11-overview/). Connect to [Amazon Neptune](https://aws.amazon.com/neptune/), [Apache TinkerPop Gremlin Server](https://tinkerpop.apache.org/), [JanusGraph](https://janusgraph.org/), or any database that supports these protocols over HTTP.

### No Centralized Database

All user data — connections, preferences, layout settings, and query history — is stored client-side in the browser using IndexedDB. The proxy server handles SigV4 request signing and request routing but does not store any user data. There is no external database to set up or manage.

### Interactive Graph Exploration

Double-click any node to expand its first-order neighbors directly on the canvas. Use the Expand sidebar panel for more control: filter by neighbor type, narrow by attribute value, or limit the number of results returned. As the graph grows, use the Entities Filter to show or hide specific node and edge types without removing them from the graph.

### Query Editor

Execute raw Gremlin, openCypher, or SPARQL queries directly from the Search panel's Query tab. Results are displayed inline and can be added to the graph individually or all at once.

### Customizable Styles

Personalize how each node and edge type appears on the canvas. Change colors, shapes, borders, icons, and which property is displayed as the label. You can also rename how type names are displayed throughout the application — for example, show the `airport` label as "Airport" or a `route` edge as "Flies To" — without modifying the underlying data. Styles can be [exported and imported](./settings.md#styles) from the Settings → Styles page to share a visual configuration across machines or with teammates.

### Save & Load Graph

Export the current graph as a JSON file to save your work, share it with a colleague, or reload it later. Anyone with the same database connection can import the file and pick up exactly where you left off.

## Feature Details

For detailed documentation on each part of the application:

- [Connections](./connections.md) — Create and manage connections to graph databases.
- [Graph View](./graph-view.md) — Search, browse, expand, and customize views of your graph data.
- [Data Table](./data-table.md) — View tabular data for specific node types.
- [Schema View](./schema-view.md) — Visualize the schema of your graph database.
- [Settings](./settings.md) — Configure application-wide preferences.

If you are interested in where Graph Explorer is headed in the future, check out our [roadmap](../../ROADMAP.md) and [participate in the discussions](https://github.com/aws/graph-explorer/discussions).
