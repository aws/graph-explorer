# Air Routes Sample

| Database         | Query Language | Data Source  |
| ---------------- | -------------- | ------------ |
| [Gremlin Server] | [Gremlin]      | [Air Routes] |

[Air Routes]: https://tinkerpop.apache.org/docs/3.8.1/upgrade/#air-routes-dataset
[Gremlin]: https://tinkerpop.apache.org/gremlin.html
[Gremlin Server]: https://tinkerpop.apache.org/docs/current/reference/#gremlin-server

This sample uses Gremlin Server 3.8.1 as the database pre-loaded with the [air routes dataset](https://tinkerpop.apache.org/docs/3.8.1/upgrade/#air-routes-dataset) and shows how to configure Graph Explorer to connect to it automatically with a default connection.

> [!NOTE]
> The data is not persisted between restarts of the Docker container.

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
