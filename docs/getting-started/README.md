# Getting Started

Graph Explorer is distributed as a Docker image. The image includes the Graph Explorer web application and a proxy server that handles connections to your graph database.

## Try It Out

The fastest way to try Graph Explorer is with the [Air Routes sample](../../samples/air_routes/README.md). It launches Graph Explorer and a Gremlin Server pre-loaded with sample data using Docker Compose — no database setup or AWS account required.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine

### Steps

1. Clone the repository
   ```
   git clone https://github.com/aws/graph-explorer.git
   ```
2. Navigate to the sample directory and start the containers
   ```
   cd graph-explorer/samples/air_routes
   docker compose up
   ```
3. Open the browser and navigate to: [http://localhost:8080/explorer](http://localhost:8080/explorer)

See the [samples directory](../../samples) for more examples.

## Next Steps

- [Connecting to databases](../guides#connecting-to-databases) — Neptune, Gremlin Server, BlazeGraph
- [Deployment guides](../guides#deployment) — EC2, ECS Fargate, SageMaker
- [References](../references) — Security, logging, health checks, and configuration
- [Development](../development.md) — Build from source for local development
- [Troubleshooting](../guides/troubleshooting.md) — Common issues and workarounds
