# Features

Graph Explorer provides a visual interface for exploring and analyzing graph data without writing queries.

## Feature Highlights

### Multiple Query Languages

Graph Explorer supports property graphs via [Gremlin](https://tinkerpop.apache.org/gremlin.html) and [openCypher](https://opencypher.org), as well as RDF graphs via [SPARQL](https://www.w3.org/TR/sparql11-overview/). Connect to [Amazon Neptune](https://aws.amazon.com/neptune/), [Apache TinkerPop Gremlin Server](https://tinkerpop.apache.org/), [JanusGraph](https://janusgraph.org/), or any database that supports these protocols over HTTP.

### No Centralized Database

All user data — connections, preferences, layout settings, and query history — is stored client-side in the browser using IndexedDB. The proxy server handles authentication and request routing but does not store any user data. There is no external database to set up or manage.

### Interactive Graph Exploration

Double-click any node to expand its first-order neighbors directly on the canvas. Use the Expand sidebar panel for more control: filter by neighbor type, narrow by attribute value, or limit the number of results returned.

### Query Editor

Execute raw Gremlin, openCypher, or SPARQL queries directly from the Search panel's Query tab. Results are displayed inline and can be added to the graph individually or all at once.

### Customizable Styles

Personalize how each node and edge type appears on the canvas. Change colors, shapes, borders, icons, and which property is displayed as the label. Styling is saved per connection and persists across sessions.

### Rename Labels

Override how node and edge type names are displayed throughout the application. For example, rename the `airport` label to "Airport" or a `route` edge to "Flies To" without modifying the underlying data.

### Entities Filter

Control which node and edge types are visible on the canvas. Unchecking a type hides those entities from view without removing them from the graph, letting you focus on the subset of data that matters.

## Feature Details

For detailed documentation on each part of the application:

- [Connections](./connections.md) — Create and manage connections to graph databases.
- [Graph View](./graph-view.md) — Search, browse, expand, and customize views of your graph data.
- [Data Table](./data-table.md) — View tabular data for specific node types.
- [Schema View](./schema-view.md) — Visualize the schema of your graph database.
- [Settings](./settings.md) — Configure application-wide preferences.

If you are interested in where Graph Explorer is headed in the future, check out our [roadmap](../../ROADMAP.md) and [participate in the discussions](https://github.com/aws/graph-explorer/discussions).
