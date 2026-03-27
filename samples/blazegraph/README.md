# Blazegraph Sample

| Database     | Query Language | Data Source |
| ------------ | -------------- | ----------- |
| [Blazegraph] | [SPARQL]       | Sample RDF  |

[Blazegraph]: https://blazegraph.com/
[SPARQL]: https://www.w3.org/TR/sparql11-overview/

This sample uses Blazegraph as the RDF database pre-loaded with sample social
network data and shows how to configure Graph Explorer to connect to it
automatically with a default connection.

> [!NOTE]  
> The data is not persisted between restarts of the Docker container.

## Sample Data

The sample includes a small social network with:

- 4 people (Alice, Bob, Charlie, Diana)
- 3 organizations (TechCorp, Startup, Nonprofit)
- Relationships showing who knows whom and where people work

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your
  machine

## Running Sample

1. Clone or download this repository
2. Navigate to the `samples/blazegraph` directory
   ```
   cd samples/blazegraph
   ```
3. Run the following command to start both services
   ```
   docker compose up
   ```
4. Wait for both services to start (Blazegraph will load sample data
   automatically)
5. Open the browser and navigate to:
   [http://localhost:8080/explorer](http://localhost:8080/explorer)

## Stopping the Sample

To stop the services, press `Ctrl+C` in the terminal or run:

```
docker compose down
```
