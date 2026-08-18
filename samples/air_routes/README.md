# Air Routes Sample

| Database         | Query Language | Data Source  |
| ---------------- | -------------- | ------------ |
| [Gremlin Server] | [Gremlin]      | [Air Routes] |

[Air Routes]: https://tinkerpop.apache.org/docs/3.8.1/upgrade/#air-routes-dataset
[Gremlin]: https://tinkerpop.apache.org/gremlin.html
[Gremlin Server]: https://tinkerpop.apache.org/docs/current/reference/#gremlin-server

This sample uses Gremlin Server 3.8 as the database pre-loaded with the [air routes dataset](https://tinkerpop.apache.org/docs/3.8.1/upgrade/#air-routes-dataset) and shows how to configure Graph Explorer to connect to it automatically with a default connection.

> [!WARNING]
> **This sample is for local development and evaluation only.** Do not use it
> as a template for a production deployment.
>
> - **No authentication** — anyone who can reach it has full access.
> - **Not hardened** — it is configured for convenience, not security.
> - **No persistence** — data is lost when the container restarts.
>
> Run it only on a trusted local network.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine

## Running Sample

1. Clone or download this repository
2. Navigate to the `samples/air_routes` directory
   ```
   cd samples/air_routes
   ```
3. Run the following command to run the Docker image
   ```
   docker compose up
   ```
4. Open the browser and navigate to: [http://localhost:8080/explorer](http://localhost:8080/explorer)

## Loading the sample styles

1. Launch the sample and open [http://localhost:8080/explorer](http://localhost:8080/explorer).
2. Open **Settings** from the left sidebar.
3. Go to the **Styles** section.
4. Click **Load styles**.
5. Select the `samples/air_routes/styles.json` file from this repository on your machine. If you copied only `docker-compose.yaml`, download `styles.json` from the repository first: https://github.com/aws/graph-explorer/blob/main/samples/air_routes/styles.json
6. In the selective import modal, keep all five styles selected (or pick only the ones you want), then click **Load selected**.
7. Return to the **Graph** or **Schema** view. Airports, countries, and continents now render with distinct shapes, colors, and icons; routes and contains edges also have distinct line styles.

> **Note:** The browser file picker reads from your host filesystem, not the Docker container. No volume mount is needed — just ensure `styles.json` is available on your machine before loading it.

To customize the styles or create your own, see [STYLING-REFERENCE.md](./STYLING-REFERENCE.md) for the complete property reference and available values.

Once it is running, the [Getting Started tutorial](../../docs/getting-started/README.md) walks you through exploring the air routes data step by step.
