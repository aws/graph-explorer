## Connections

This section contains detailed instructions that help when configuring Graph
Explorer with different graph database engines.

### Connecting to Neptune

- Ensure that Graph Explorer has access to the Neptune instance by being in the
  same VPC or VPC peering.
- If authentication is enabled, read query privileges are needed (See
  [ReadDataViaQuery managed policy](https://docs.aws.amazon.com/neptune/latest/userguide/iam-data-access-examples.html#iam-auth-data-policy-example-read-query)).

### Connecting to Gremlin-Server

- The Graph Explorer currently supports HTTP(S) connections. When connecting to
  Gremlin-Server, ensure it is configured with a channelizer that support
  HTTP(S) (i.e.
  [Channelizer Documentation](https://tinkerpop.apache.org/javadocs/current/full/org/apache/tinkerpop/gremlin/server/Channelizer.html)).
  The Gremlin Server configuration can be usually found at:
  /conf/gremlin-server.yaml.
- Remove “.withStrategies(ReferenceElementStrategy)” from
  `/scripts/generate-modern.groovy` so that properties are returned.
- Change `gremlin.tinkergraph.vertexIdManager` and
  `gremlin.tinkergraph.edgeIdManager` in `/conf/tinkergraph-empty.properties` to
  support string ids. You can use `ANY`.
- Build and run the Docker container as normal.

### Connecting to BlazeGraph

- Build and run the Docker container as normal and connect the proxy-server to
  BlazeGraph and your workbench to the proxy-server.
- If using Docker, ensure that the container running the workbench can properly
  access the container running BlazeGraph. You can find documentation on how to
  connect containers via [Docker networks](https://docs.docker.com/network/).
