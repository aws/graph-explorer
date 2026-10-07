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

## Versions Prior to 3.7

If you have a version of Gremlin Server prior to 3.7, you will need to make the following changes:

- **Enable property returns** - Remove ".withStrategies(ReferenceElementStrategy)" from `/scripts/generate-modern.groovy` so that properties are returned.
- **Enable string IDs** - Change `gremlin.tinkergraph.vertexIdManager` and `gremlin.tinkergraph.edgeIdManager` in `/conf/tinkergraph-empty.properties` to support string ids. You can use `ANY`.
- Build and run the Docker container as normal.
