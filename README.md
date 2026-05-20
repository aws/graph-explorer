# Graph Explorer

Graph Explorer is a React-based web application that makes it easy to visualize and explore graph data, no query language knowledge required. Search for nodes, expand connections, and discover relationships across your graph database through an intuitive visual interface.

Connect to graph databases that support [Apache TinkerPop Gremlin](https://tinkerpop.apache.org/) or [W3C RDF/SPARQL](https://www.w3.org/TR/sparql11-overview/) over HTTP, or [openCypher](https://opencypher.org) via [Amazon Neptune](https://aws.amazon.com/neptune/).

## Explore Your Data

Graph Explorer provides three integrated views for working with your graph database, all in one app.

### Graph View

Search, visualize, and explore connections between nodes with an interactive graph layout. Expand neighbors, filter by type, and run custom queries, all from a single view.

![Graph Explorer showing an interactive visualization of airport routes with search, table view, and node details](./images/graph-explorer.png)

### Data Explorer

Browse all nodes for a given type in a paginated table. View every property at a glance and send nodes directly to the graph view for further exploration.

![Data Explorer showing a tabular view of airport nodes with properties like city, code, and coordinates](./images/data-explorer.png)

### Schema Explorer

Understand your data model at a glance. See node types, their relationships, and property details rendered as an interactive schema graph.

![Schema Explorer showing the relationships between airport, country, continent, and version node types](./images/schema-explorer.png)

## Get Started

- [Hands-on tutorial](./docs/getting-started/README.md) — Try Graph Explorer with sample data using Docker Compose
- [Deployment & connection guides](./docs/guides) — Run with Docker, EC2, ECS Fargate, or SageMaker and connect to your database
- [Development](./docs/development.md) — Build from source for local development

## Documentation

See the [full documentation](./docs) for features, guides, references, and more.

## Community

- [Roadmap](./ROADMAP.md) — See what's planned
- [Changelog](./Changelog.md) — Recent releases
- [Discussions](https://github.com/aws/graph-explorer/discussions) — Ask questions and share ideas
- [Submit an Issue](https://github.com/aws/graph-explorer/issues/new/choose) — Report bugs or request features

## Contributing

See [CONTRIBUTING](./CONTRIBUTING.md) for more information.

## License

This project is licensed under the Apache-2.0 License.
