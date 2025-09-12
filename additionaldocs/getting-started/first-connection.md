# First Connection

Graph Explorer supports visualizing both **property graphs** and **RDF graphs**.
You can connect to Amazon Neptune or you can also connect to open graph
databases that implement an Apache TinkerPop Gremlin endpoint or the SPARQL 1.1
protocol, such as Blazegraph. For additional details on connecting to different
graph databases, see [Connections](../user-guide/connections.md).

## Providing a Default Connection

To provide a default connection such that initial loads of Graph Explorer always
result with the same starting connection, modify the `docker run ...` command to
either take in a JSON configuration or runtime environment variables. If you
provide both a JSON configuration and environmental variables, the JSON will be
prioritized.

### Environment Variables

These are the valid environment variables used for the default connection, their
defaults, and their descriptions.

- Required:
  - `PUBLIC_OR_PROXY_ENDPOINT` - `None` - See
    [Add a New Connection](#connections-ui)
- Optional
  - `GRAPH_TYPE` - `None` - If not specified, multiple connections will be
    created for every available graph type / query language. See
    [Add a New Connection](#connections-ui)
  - `USING_PROXY_SERVER` - `False` - See [Add a New Connection](#connections-ui)
  - `IAM` - `False` - See [Add a New Connection](#connections-ui)
  - `GRAPH_EXP_HTTPS_CONNECTION` - `True` - Controls whether Graph Explorer uses
    SSL or not
  - `PROXY_SERVER_HTTPS_CONNECTION` - `True` - Controls whether the server uses
    SSL or not
  - `GRAPH_EXP_FETCH_REQUEST_TIMEOUT` - `240000` - Controls the timeout for the
    fetch request. Measured in milliseconds (i.e. 240000 is 240 seconds or 4
    minutes).
  - `GRAPH_EXP_NODE_EXPANSION_LIMIT` - `None` - Controls the limit for node
    counts and expansion queries.
- Conditionally Required:
  - Required if `USING_PROXY_SERVER=True`
    - `GRAPH_CONNECTION_URL` - `None` - See
      [Add a New Connection](#connections-ui)
  - Required if `USING_PROXY_SERVER=True` and `IAM=True`
    - `AWS_REGION` - `None` - See [Add a New Connection](#connections-ui)
    - `SERVICE_TYPE` - `neptune-db`, Set this as `neptune-db` for Neptune
      database or `neptune-graph` for Neptune Analytics.

### JSON Configuration Approach

First, create a `config.json` file containing values for the connection
attributes:

```js
{
  "PUBLIC_OR_PROXY_ENDPOINT": "https://public-endpoint",
  "GRAPH_CONNECTION_URL": "https://cluster-cqmizgqgrsbf.us-west-2.neptune.amazonaws.com:8182",
  "USING_PROXY_SERVER": true,
  "IAM": true,
  "SERVICE_TYPE": "neptune-db",
  "AWS_REGION": "us-west-2",
  // Possible Values are "gremlin", "sparql", "openCypher"
  "GRAPH_TYPE": "gremlin",
  "GRAPH_EXP_HTTPS_CONNECTION": true,
  "PROXY_SERVER_HTTPS_CONNECTION": true,
  // Measured in milliseconds (i.e. 240000 is 240 seconds or 4 minutes)
  "GRAPH_EXP_FETCH_REQUEST_TIMEOUT": 240000,
  "GRAPH_EXP_NODE_EXPANSION_LIMIT": 500,
}
```

Pass the `config.json` file path to the `docker run` command.

```bash
docker run -p 80:80 -p 443:443 \
 --env HOST={hostname-or-ip-address} \
 -v /path/to/config.json:/graph-explorer/config.json \
 public.ecr.aws/neptune/graph-explorer
```

### Environment Variable Approach

Provide the desired connection variables directly to the `docker run` command,
as follows:

```bash
docker run -p 80:80 -p 443:443 \
 --env HOST={hostname-or-ip-address} \
 --env PUBLIC_OR_PROXY_ENDPOINT=https://public-endpoint \
 --env GRAPH_TYPE=gremlin \
 --env USING_PROXY_SERVER=true \
 --env IAM=false \
 --env GRAPH_CONNECTION_URL=https://cluster-cqmizgqgrsbf.us-west-2.neptune.amazonaws.com:8182 \
 --env AWS_REGION=us-west-2 \
 --env SERVICE_TYPE=neptune-db \
 --env PROXY_SERVER_HTTPS_CONNECTION=true \
 --env GRAPH_EXP_FETCH_REQUEST_TIMEOUT=240000 \
 --env GRAPH_EXP_NODE_EXPANSION_LIMIT=500 \
 public.ecr.aws/neptune/graph-explorer
```

## Database Configuration

### Connecting to Neptune

- Ensure that Graph Explorer has access to the Neptune instance by being in the
  same VPC or VPC peering.
- If authentication is enabled, read query privileges are needed (See
  [ReadDataViaQuery managed policy](https://docs.aws.amazon.com/neptune/latest/userguide/iam-data-access-examples.html#iam-auth-data-policy-example-read-query)).

### Connecting to Gremlin-Server

If you are using the default Gremlin Server docker image, you can get the server
running with the following commands:

```
docker pull tinkerpop/gremlin-server:latest
docker run -p 8182:8182 \
    tinkerpop/gremlin-server:latest \
    conf/gremlin-server-rest-modern.yaml
```

#### Enable REST

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

#### Versions Prior to 3.7

If you have a version of Gremlin Server prior to 3.7, you will need to make the
following changes:

- **Enable property returns** - Remove
  ".withStrategies(ReferenceElementStrategy)" from
  `/scripts/generate-modern.groovy` so that properties are returned.
- **Enable string IDs** - Change `gremlin.tinkergraph.vertexIdManager` and
  `gremlin.tinkergraph.edgeIdManager` in `/conf/tinkergraph-empty.properties` to
  support string ids. You can use `ANY`.
- Build and run the Docker container as normal.

### Connecting to BlazeGraph

- Build and run the Docker container as normal and connect the proxy-server to
  BlazeGraph and your workbench to the proxy-server.
- If using Docker, ensure that the container running the workbench can properly
  access the container running BlazeGraph. You can find documentation on how to
  connect containers via [Docker networks](https://docs.docker.com/network/).
