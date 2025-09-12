# Database Setup

This guide contains detailed instructions for configuring different graph
database engines to work with Graph Explorer.

## Overview

Graph Explorer supports visualizing both **property graphs** and **RDF graphs**.
You can connect to Amazon Neptune or you can also connect to open graph
databases that implement an Apache TinkerPop Gremlin endpoint or the SPARQL 1.1
protocol, such as Blazegraph. For additional details on connecting to different
graph databases, see [Connections](../user-guide/connections.md).

After setting up your database, see the
[Connections UI](../user-guide/connections.md) guide to learn how to create and
manage connections within Graph Explorer.

## Connecting to Neptune

- Ensure that Graph Explorer has access to the Neptune instance by being in the
  same VPC or VPC peering.
- If authentication is enabled, read query privileges are needed (See
  [ReadDataViaQuery managed policy](https://docs.aws.amazon.com/neptune/latest/userguide/iam-data-access-examples.html#iam-auth-data-policy-example-read-query)).

## Connecting to Gremlin-Server

If you are using the default Gremlin Server docker image, you can get the server
running with the following commands:

```
docker pull tinkerpop/gremlin-server:latest
docker run -p 8182:8182 \
    tinkerpop/gremlin-server:latest \
    conf/gremlin-server-rest-modern.yaml
```

### Enable REST

Graph Explorer only supports HTTP(S) connections. When connecting to
Gremlin-Server, ensure it is configured with a channelizer that supports HTTP(S)
(i.e.
[Channelizer Documentation](https://tinkerpop.apache.org/javadocs/current/full/org/apache/tinkerpop/gremlin/server/Channelizer.html)).

<!-- prettier-ignore -->
> [!TIP] 
> The Gremlin Server configuration can be usually found at:
>
> ```
> /conf/gremlin-server.yaml
> ```

### Versions Prior to 3.7

If you have a version of Gremlin Server prior to 3.7, you will need to make the
following changes:

- **Enable property returns** - Remove
  ".withStrategies(ReferenceElementStrategy)" from
  `/scripts/generate-modern.groovy` so that properties are returned.
- **Enable string IDs** - Change `gremlin.tinkergraph.vertexIdManager` and
  `gremlin.tinkergraph.edgeIdManager` in `/conf/tinkergraph-empty.properties` to
  support string ids. You can use `ANY`.
- Build and run the Docker container as normal.

## Connecting to BlazeGraph

- Build and run the Docker container as normal and connect the proxy-server to
  BlazeGraph and your workbench to the proxy-server.
- If using Docker, ensure that the container running the workbench can properly
  access the container running BlazeGraph. You can find documentation on how to
  connect containers via [Docker networks](https://docs.docker.com/network/).
