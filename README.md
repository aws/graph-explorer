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
[Getting Started](./additionaldocs/getting-started/README.md) guide.

- [Local Docker Setup](./additionaldocs/deployment/docker.md) - A quick start
  guide to deploying Graph Explorer locally using the official Docker image.
- [Amazon EC2 Setup](./additionaldocs/deployment/aws-ec2.md) - A quick start
  guide to setting up Graph Explorer on Amazon EC2 with Neptune.
- [Local Development](./additionaldocs/development/development-setup.md) - A
  quick start guide building the Docker image from source code.
- [Troubleshooting](./additionaldocs/troubleshooting/) - A collection of helpful
  tips if you run in to issues while setting up Graph Explorer.
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
[detailed user guide](./additionaldocs/user-guide/).

If you're interested in our future development plans, check out our
[roadmap](./ROADMAP.md) and participate in the discussions.

## Development

For development guidance, see [Development](./additionaldocs/development/).

## Health Check Status

The `graph-explorer-proxy-server` provides a `/status` endpoint for monitoring
its health and readiness. This endpoint is crucial for ensuring reliable service
operation and can be utilized in various deployment scenarios.

**Key Features:**

- **Health Check:** The `/status` endpoint serves as a basic health check,
  confirming that the Express server is running and responding. This is
  essential for load balancers (like AWS ALB) to determine if the server is
  operational and should receive traffic.
- **Readiness Probe:** It also functions as a readiness probe in container
  orchestration systems (like Kubernetes). This allows the orchestrator to know
  when the server is ready to accept requests, preventing traffic from being
  routed to instances that are still starting up or experiencing issues.
- **Expected Response:** A successful health check or readiness probe will
  result in an HTTP `200 OK` response with the body containing `OK`.

## Logging

Logs are, by default, sent to the console and will be visible as output to the
docker logs. If you want to access the full set of logs, you can run
`docker logs {container name or id}`.

The log level will be set via the `LOG_LEVEL` env variable at
`/packages/graph-explorer/.env` where the possible options, from highest to
lowest, are `error`, `warn`, `info`, `debug`, and `trace` such that `error` is
the highest level and will only include logs labeled as errors and `trace` the
lowest and will include any type of log.

By default, the log level is set to `info` and the only type of logs generated
are those of `error`, `info`, or `debug`. If you need more detailed logs, you
can change the log level from `info` in the default .env file to `debug` and the
logs will begin printing the error's stack trace.

Within node-server.js, you'll notice three things.

1. A `proxyLogger` object - This is responsible for actually recording the logs.
2. An `errorHandler` - This automatically sends errors to the `proxyLogger` and
   can log extra information by adding wanted text to the error object at a key
   called `extraInfo`.
3. An endpoint called `/logger` - This is how you would log things from the
   browser. It needs a log level and message header passed and you can then
   expect to see the message logged at the provided log level.

## Contributing Guidelines

See [CONTRIBUTING](./CONTRIBUTING.md) for more information.

## License

This project is licensed under the Apache-2.0 License.
