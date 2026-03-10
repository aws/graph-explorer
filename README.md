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

### Flexible Deployment

Run Graph Explorer wherever it fits your workflow: as a Docker container, on an Amazon EC2 instance, through Amazon SageMaker, or locally from source during development. Configure multiple connections to different databases and switch between them seamlessly. See [Getting Started](#getting-started) for setup guides.

## Learn More

- [Getting Started](./docs/getting-started/README.md) - Set up Graph Explorer with Docker, EC2, or from source
- [Features Overview](./docs/features/README.md) - Detailed guide to all features and functionality
- [Guides](./docs/guides) - Database connections, deployment, and troubleshooting
- [Roadmap](./ROADMAP.md) - See what's planned for future releases
- [Discussions](https://github.com/aws/graph-explorer/discussions) - Ask questions, share ideas, and connect with the community
- [Submit an Issue](https://github.com/aws/graph-explorer/issues/new/choose) - Report bugs or request new features
- [Contributing](./CONTRIBUTING.md) - Learn how to contribute to Graph Explorer
- [Changelog](./Changelog.md) - See what's changed in recent releases

## Getting Started

There are many ways to deploy and run Graph Explorer. If you are new to graph databases and Graph Explorer, we recommend that you check out the [Getting Started](./docs/getting-started/README.md) guide.

- [Local Docker Setup](./docs/getting-started/README.md#local-docker-setup) - A quick start guide to deploying Graph Explorer locally using the official Docker image.
- [Amazon EC2 Setup](./docs/getting-started/README.md#amazon-ec2-setup) - A quick start guide to setting up Graph Explorer on Amazon EC2 with Neptune.
- [Local Development](./docs/getting-started/README.md#local-development-setup) - A quick start guide building the Docker image from source code.
- [Troubleshooting](./docs/guides/troubleshooting.md) - A collection of helpful tips if you run in to issues while setting up Graph Explorer.
- [Samples](./samples) - A collection of Docker Compose files that show various ways to configure and use Graph Explorer.

## Connections

Graph Explorer supports visualizing both **property graphs** and **RDF graphs**. You can connect to Amazon Neptune or you can also connect to open graph databases that implement an Apache TinkerPop Gremlin endpoint or the SPARQL 1.1 protocol, such as Blazegraph. For additional details on connecting to different graph databases, see [Guides](./docs/guides).

## Development

For development guidance, see [Development](./docs/development.md).

## Contributing Guidelines

See [CONTRIBUTING](./CONTRIBUTING.md) for more information.

## License

This project is licensed under the Apache-2.0 License.
