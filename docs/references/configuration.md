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

### `LOG_STYLE`

Controls the log output format.

- Optional
- Default: `default`
- Type: `"cloudwatch" | "default"`
- `cloudwatch` omits timestamps and hostname/pid (these are provided by CloudWatch)
- `default` uses the standard log format

### `CONFIGURATION_FOLDER_PATH`

Override path for the folder containing `.env` and `defaultConnection.json`. When set, replaces the default path entirely.

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
  "GRAPH_EXP_NODE_EXPANSION_LIMIT": 500
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
 public.ecr.aws/neptune/graph-explorer
```
