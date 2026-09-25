[← References](./)

# Configuration

All environment variables for configuring Graph Explorer, organized by concern.

## Application Configuration

These variables control server behavior, networking, and security.

### `GRAPH_EXP_ENV_ROOT_FOLDER`

Base path used to serve the `graph-explorer` front end application.

Example: `/explorer`

- Optional
- Default: `/`
- Type: `string`

### `HOST`

The public hostname of the server. This is used to generate the self-signed SSL certificate at container startup.

Example: `localhost`

- Required when using HTTPS connections
- Default is `localhost`
- Type: `string`

### `GRAPH_EXP_HTTPS_CONNECTION`

Uses the self-signed certificate to serve Graph Explorer over https if true. Only used in Docker via the entrypoint script.

- Optional
- Default `true` in Docker, not set otherwise
- Type: `boolean`

### `PROXY_SERVER_HTTPS_PORT`

The port to use for the HTTPS server.

- Optional
- Default `443`
- Type: `number`

### `PROXY_SERVER_HTTP_PORT`

The port to use for the HTTP server.

- Optional
- Default `80`
- Type: `number`

### `PROXY_SERVER_HTTPS_CONNECTION`

Uses the self-signed certificate to serve the proxy-server over https if true.

- Optional
- Default `false` in code, `true` in Docker via the entrypoint script
- Type: `boolean`

### `PROXY_SERVER_CORS_ORIGIN`

Restricts which origins are allowed to make cross-origin requests to the proxy server. When set, only requests from these exact origins will receive CORS headers. When not set, cross-origin requests are blocked. Each origin must include the scheme and must not have a trailing slash or path.

Example: `https://my-app.example.com` or `https://app-a.example.com,https://app-b.example.com`

- Optional
- Default: cross-origin requests blocked
- Type: `string` (comma-separated for multiple origins)

### `PROXY_SERVER_ALLOWED_DB_ORIGINS`

Restricts which database origins the proxy server will forward requests to. When set, requests targeting an origin not in the list receive a 403 response. When not set, the proxy forwards to any database URL specified by the client (current default behavior).

Values must be origins (scheme + host + optional port). Including a path will cause a startup error.

Examples:

```bash
# Single origin
PROXY_SERVER_ALLOWED_DB_ORIGINS=https://my-neptune-cluster:8182

# Multiple origins
PROXY_SERVER_ALLOWED_DB_ORIGINS=https://cluster-a:8182,https://cluster-b:8182

# INVALID — paths are not allowed
PROXY_SERVER_ALLOWED_DB_ORIGINS=https://my-neptune-cluster:8182/sparql
```

- Optional
- Default: all origins allowed
- Type: `string` (comma-separated for multiple origins)

> [!NOTE]
>
> This check only applies to requests routed through the proxy server. Connections configured to contact the database directly (bypassing the proxy) are not subject to the allowlist.

### `LOG_STYLE`

Controls the log output format.

- Optional
- Default: `default`
- Type: `"cloudwatch" | "default"`
- `cloudwatch` omits timestamps and hostname/pid (these are provided by CloudWatch)
- `default` uses the standard log format

### `CONFIGURATION_FOLDER_PATH`

Override path for the folder containing `.env` and `defaultConnection.json`. When set, replaces the default path entirely.

At startup, the container writes its settings to this folder: always `.env`, and `defaultConnection.json` too when a default connection is configured. The folder must be writable by the container, or it refuses to start. See [Graph Explorer can't start because it can't write .env](../guides/troubleshooting.md#graph-explorer-cant-start-because-it-cant-write-env) if you hit this.

Mounting `config.json` read-only at `/graph-explorer/config.json` (see [JSON Configuration Approach](#json-configuration-approach)) is unaffected, since that file lives outside the configuration folder.

- Optional
- Default: `<client root>` (`packages/graph-explorer`)
- Type: `string`

## Default Connection

To provide a default connection such that initial loads of Graph Explorer always result with the same starting connection, modify the `docker run ...` command to either take in a JSON configuration or runtime environment variables. If you provide both a JSON configuration and environmental variables, the JSON will be prioritized.

### Environment Variables

These are the valid environment variables used for the default connection, their defaults, and their descriptions.

- Required:
  - `PUBLIC_OR_PROXY_ENDPOINT` - `None`
- Optional
  - `GRAPH_TYPE` - `None` - If not specified, multiple connections will be created for every available query language.
  - `USING_PROXY_SERVER` - `False`
  - `IAM` - `False`
  - `GRAPH_EXP_HTTPS_CONNECTION` - `True` - Controls whether Graph Explorer uses SSL or not
  - `PROXY_SERVER_HTTPS_CONNECTION` - `True` - Controls whether the server uses SSL or not
  - `GRAPH_EXP_FETCH_REQUEST_TIMEOUT` - `240000` - Controls the timeout for the fetch request. Measured in milliseconds (i.e. 240000 is 240 seconds or 4 minutes).
  - `GRAPH_EXP_NODE_EXPANSION_LIMIT` - `None` - Controls the limit for node counts and expansion queries.
  - `EDGE_CONNECTION_DISCOVERY` - `auto` - Gremlin only. Controls how much of the graph is read to work out which node types each edge type connects. Accepts `auto`, `complete`, or `sampled`, in lowercase. Any other value is ignored with a warning in the browser console, and discovery stays on `auto`. See [Edge connection discovery](#edge-connection-discovery).
- Conditionally Required:
  - Required if `USING_PROXY_SERVER=True`
    - `GRAPH_CONNECTION_URL` - `None`
  - Required if `USING_PROXY_SERVER=True` and `IAM=True`
    - `AWS_REGION` - `None`
    - `SERVICE_TYPE` - `neptune-db`, Set this as `neptune-db` for Neptune database or `neptune-graph` for Neptune Analytics.

### JSON Configuration Approach

First, create a `config.json` file containing values for the connection attributes:

```json
{
  "PUBLIC_OR_PROXY_ENDPOINT": "https://public-endpoint",
  "GRAPH_CONNECTION_URL": "https://{your-cluster-id}.us-west-2.neptune.amazonaws.com:8182",
  "USING_PROXY_SERVER": true,
  "IAM": true,
  "SERVICE_TYPE": "neptune-db",
  "AWS_REGION": "us-west-2",
  "GRAPH_TYPE": "gremlin",
  "GRAPH_EXP_HTTPS_CONNECTION": true,
  "PROXY_SERVER_HTTPS_CONNECTION": true,
  "GRAPH_EXP_FETCH_REQUEST_TIMEOUT": 240000,
  "GRAPH_EXP_NODE_EXPANSION_LIMIT": 500,
  "EDGE_CONNECTION_DISCOVERY": "auto"
}
```

`GRAPH_TYPE` accepts `"gremlin"`, `"sparql"`, or `"openCypher"`. `GRAPH_EXP_FETCH_REQUEST_TIMEOUT` is measured in milliseconds (e.g., 240000 is 4 minutes).

Pass the `config.json` file path to the `docker run` command.

```bash
docker run -p 80:80 -p 443:443 \
 --env HOST={hostname-or-ip-address} \
 -v /path/to/config.json:/graph-explorer/config.json \
 public.ecr.aws/neptune/graph-explorer
```

### Environment Variable Approach

Provide the desired connection variables directly to the `docker run` command, as follows:

```bash
docker run -p 80:80 -p 443:443 \
 --env HOST={hostname-or-ip-address} \
 --env PUBLIC_OR_PROXY_ENDPOINT=https://public-endpoint \
 --env GRAPH_TYPE=gremlin \
 --env USING_PROXY_SERVER=true \
 --env IAM=false \
 --env GRAPH_CONNECTION_URL=https://{your-cluster-id}.us-west-2.neptune.amazonaws.com:8182 \
 --env AWS_REGION=us-west-2 \
 --env SERVICE_TYPE=neptune-db \
 --env PROXY_SERVER_HTTPS_CONNECTION=true \
 --env GRAPH_EXP_FETCH_REQUEST_TIMEOUT=240000 \
 --env GRAPH_EXP_NODE_EXPANSION_LIMIT=500 \
 --env EDGE_CONNECTION_DISCOVERY=auto \
 public.ecr.aws/neptune/graph-explorer
```

## Edge connection discovery

The Schema view draws which node types each edge type connects. Working that out means reading edges, and on a large graph reading all of them can be slow or exceed what the database allows. `EDGE_CONNECTION_DISCOVERY`, also available per connection in the connection dialog, controls how much gets read. Gremlin connections only.

| Value      | Behavior                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `auto`     | Chooses based on how many edge types the graph has and how large it is. The default, and the right answer for almost everyone.    |
| `complete` | Scans every edge to find all edge connections. Can be slow, or fail, on very large graphs.                                        |
| `sampled`  | Checks up to 10,000 edges per edge type. Fast and predictable on very large graphs. Will miss edge connections that occur rarely. |

`auto` picks one of the other two up front, from the number of edge types and the size of the graph. It does not always try a complete scan first: on a graph with a few very large edge types it goes straight to sampling. When it does choose a complete scan and the database rejects that as too large, or takes more than 20 seconds over a single request, it falls back to sampling on its own. So reach for the other two values only when you need to pin the behavior, and `sampled` is the one to try if the Schema view is slow or erroring on a large graph.

`complete` never falls back, because falling back would contradict the setting. If the database cannot read every edge, the Schema view reports the failure and says which setting to change.

openCypher and SPARQL connections always sample up to 10,000 edges per edge type and have no complete option, so they can miss rare edge connections too. That is why this setting appears only on Gremlin connections, and why the same graph can give a more complete Schema view over Gremlin than over the other two.

Nothing else in Graph Explorer depends on edge connections, so a failure here degrades the Schema view and leaves every other view working.
