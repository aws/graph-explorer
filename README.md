# Graph Explorer

Graph Explorer provides a React-based web application that enables users to
visualize both property graph and RDF data and explore connections between data
without having to write graph queries. You can connect to a graph database over
HTTP that supports the
[W3C RDF/SPARQL](https://www.w3.org/TR/sparql11-overview/) open standard, the
[openCypher](https://opencypher.org) open source specification, or the open
source [Apache TinkerPop Gremlin](https://tinkerpop.apache.org/).

To get started, you can deploy Graph Explorer on a local machine using
[Docker Desktop](https://www.docker.com/products/docker-desktop/), or in the
cloud using [Amazon EC2](https://aws.amazon.com/ec2/) or a container service
like [Amazon ECS](https://aws.amazon.com/ecs/).

![A sample image of property graph created by Graph Explorer](./images/LPGIMDb.png)
![A sample image of RDF graph created by Graph Explorer](./images/RDFEPL.png)

## Getting Started

There are many ways to deploy and run Graph Explorer. If you are new to graph
databases and Graph Explorer, we recommend that you check out the
[Getting Started](./docs/getting-started/README.md) guide.

- [Local Docker Setup](./docs/deployment/docker.md) - A quick start guide to
  deploying Graph Explorer locally using the official Docker image.
- [Amazon EC2 Setup](./docs/deployment/aws-ec2.md) - A quick start guide to
  setting up Graph Explorer on Amazon EC2 with Neptune.
- [Local Development](./docs/development/development-setup.md) - A quick start
  guide building the Docker image from source code.
- [Troubleshooting](./docs/troubleshooting/) - A collection of helpful tips if
  you run in to issues while setting up Graph Explorer.
- [Samples](./samples) - A collection of Docker Compose files that show various
  ways to configure and use Graph Explorer.

## Features Overview

Graph Explorer offers a comprehensive set of tools for interacting with graph
databases:

- **Connections** - Create and manage connections to graph databases
- **Graph View** - Visualize and interact with graph data through:
  - Interactive graph visualization
  - Powerful search capabilities
  - Custom query execution and visualization
  - Customizable styling options
  - Detailed node/edge information
- **Tabular View** - Interact with nodes & edges that have been added to the
  graph view
  - Show or hide individual nodes & edges
  - Filtered nodes and edges will fade in the graph view
  - Export table to CSV or JSON file
- **Data Explorer** - Examine specific node types and send nodes to the graph
  view

For complete documentation on all features and functionality, please see our
[detailed user guide](./docs/user-guide/).

If you're interested in our future development plans, check out our
[roadmap](./ROADMAP.md) and participate in the discussions.

## Development

For development guidance, see [Development](./docs/development/).

## Contributing Guidelines

See [CONTRIBUTING](./CONTRIBUTING.md) for more information.

## License

This project is licensed under the Apache-2.0 License.
