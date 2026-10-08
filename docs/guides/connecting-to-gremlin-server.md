[← Guides](./)

# Connecting to Gremlin-Server

> [!WARNING]
>
> This walkthrough runs Gremlin Server with its default Groovy script engine and is meant for local development only. If anyone other than you can reach Graph Explorer or the server, see [Self-hosted Gremlin Server](../references/security.md#self-hosted-gremlin-server).

If you are using the default Gremlin Server docker image, you can get the server running with the following commands:

```
docker pull tinkerpop/gremlin-server:latest
docker run -p 8182:8182 \
    tinkerpop/gremlin-server:latest \
    conf/gremlin-server-rest-modern.yaml
```

Then open Graph Explorer and add a new connection with the following settings:

- Name: `Gremlin Server`
- Database URL: `http://localhost:8182`
- Query Language: `Gremlin`

## Enable REST

Graph Explorer only supports HTTP(S) connections. When connecting to Gremlin-Server, ensure it is configured with a channelizer that supports HTTP(S) (i.e. [Channelizer Documentation](https://tinkerpop.apache.org/javadocs/current/full/org/apache/tinkerpop/gremlin/server/Channelizer.html)).

> [!TIP]
>
> The Gremlin Server configuration can be usually found at:
>
> ```
> /conf/gremlin-server.yaml
> ```

## Connect directly from the browser

With **Connection method** set to **Directly via browser**, your browser sends queries to Gremlin Server itself instead of going through the Graph Explorer server. Gremlin Server's HTTP endpoint allows cross-origin requests from any site by default. It leaves the CORS headers off error responses, so a failed query shows as [Database not reachable from the browser](./troubleshooting.md#database-not-reachable-from-the-browser). To see the server's error message, use **Via proxy server**.

- The browser must be able to reach the Database URL. A server in a Docker container on your machine needs its port published to the host.
- When Graph Explorer is served over HTTPS, the browser usually blocks an `http://` Database URL unless it points at a loopback host such as `localhost`. See [Insecure Database URL](./troubleshooting.md#insecure-database-url).

A direct connection needs your browser to reach Gremlin Server, and every other site open in that browser can then reach it too, even when it listens only on `localhost`. Graph Explorer sends queries as scripts, which Gremlin Server evaluates with its Groovy script engine, so weigh that before choosing this method. See [Self-hosted Gremlin Server](../references/security.md#self-hosted-gremlin-server).

## Versions Prior to 3.7

If you have a version of Gremlin Server prior to 3.7, you will need to make the following changes:

- **Enable property returns** - Remove ".withStrategies(ReferenceElementStrategy)" from `/scripts/generate-modern.groovy` so that properties are returned.
- **Enable string IDs** - Change `gremlin.tinkergraph.vertexIdManager` and `gremlin.tinkergraph.edgeIdManager` in `/conf/tinkergraph-empty.properties` to support string ids. You can use `ANY`.
- Build and run the Docker container as normal.
