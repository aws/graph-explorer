[← References](./)

# Configuration

All environment variables for configuring Graph Explorer, organized by concern.

## Application Configuration

These variables control server behavior, networking, and security.

### `HOST`

The public hostname of the server. It feeds the Subject Alternative Name of the self-signed SSL certificate and the URL the server prints at startup. It doesn't limit who can reach the server, which listens on every network interface. See [Supported Hosting](./security.md#supported-hosting).

In Docker with HTTPS on, `HOST` decides where the certificate comes from. When it is set, a new container generates a fresh self-signed certificate for that hostname, which invalidates any trust you granted to the previous one. When it is unset, the container reuses the certificate files already in `cert-info` and stops if any are missing. See [HTTPS Connections](./security.md#https-connections) and [Keeping the certificate across container replacements](./security.md#keeping-the-certificate-across-container-replacements).

Example: `localhost`

- Required in Docker with HTTPS on, unless `cert-info` already holds the certificate files, such as your own certificates or ones kept in a volume
- Default: none. When unset, the URL the server prints at startup uses `localhost`.
- Type: `string`

### `PROXY_SERVER_PORT`

The port the proxy server listens on. The server runs one listener, HTTPS or HTTP depending on [`PROXY_SERVER_HTTPS_CONNECTION`](#proxy_server_https_connection), and this port applies to whichever one runs.

Example: `9250`

- Optional
- Default: `443` with HTTPS, `80` with HTTP
- Type: `number` from `1` to `65535`

> [!NOTE]
>
> In Kubernetes, a Service named `proxy-server` in the pod's namespace makes the kubelet set `PROXY_SERVER_PORT=tcp://<ip>:<port>` in the pod, which fails startup. To avoid it, set `PROXY_SERVER_PORT` in the container's `env`, or set `enableServiceLinks: false` in the pod spec.

### `PROXY_SERVER_HTTPS_PORT`

> [!NOTE]
>
> Deprecated. Use [`PROXY_SERVER_PORT`](#proxy_server_port) instead. This variable will be removed in a future release.

The port to use for the HTTPS server. Ignored when `PROXY_SERVER_PORT` is set. The server logs a warning at startup whenever this variable is set.

- Optional
- Default `443`
- Type: `number`

### `PROXY_SERVER_HTTP_PORT`

> [!NOTE]
>
> Deprecated. Use [`PROXY_SERVER_PORT`](#proxy_server_port) instead. This variable will be removed in a future release.

The port to use for the HTTP server. Ignored when `PROXY_SERVER_PORT` is set. The server logs a warning at startup whenever this variable is set.

- Optional
- Default `80`
- Type: `number`

### `PROXY_SERVER_HTTPS_CONNECTION`

Serves the proxy server over HTTPS when true, using the certificate files described in [HTTPS Connections](./security.md#https-connections).

Set it to `false` only behind a reverse proxy that terminates TLS, or to try Graph Explorer on your own machine. Plain HTTP that other machines can reach isn't supported. See [Serving HTTP Behind a Reverse Proxy](./security.md#serving-http-behind-a-reverse-proxy).

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

Restricts which database origins the proxy server will forward requests to. When set, requests targeting an origin not in the list receive a 403 response. When not set, the proxy forwards to any database URL specified by the client (current default behavior). See [Database Origin Allowlist](./security.md#database-origin-allowlist). Link-local addresses are refused either way. See [Link-Local Addresses](./security.md#link-local-addresses).

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
> This check applies only to requests routed through the proxy server. It doesn't apply to direct connections, because the browser sends their requests to the database itself.

### `LOG_STYLE`

Controls the log output format.

- Optional
- Default: `default`
- Type: `"cloudwatch" | "default"`
- `cloudwatch` omits timestamps and hostname/pid (these are provided by CloudWatch)
- `default` uses the standard log format

### `LOG_LEVEL`

Sets the minimum severity the proxy server logs. Values from highest to lowest are `fatal`, `error`, `warn`, `info`, `debug`, `trace`, and `silent`, which disables logging. See [Logging](./logging.md).

- Optional
- Default: `info`
- Type: `"fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent"`

> [!WARNING]
>
> At `debug` and `trace`, when **Enable database query logging on proxy server** is turned on in **Settings** > **General**, the query text sent to your database is written to the logs. Queries can contain sensitive data, so keep those levels for troubleshooting and restrict access to wherever the logs end up.

### `CONFIGURATION_FOLDER_PATH`

Override path for the folder containing `.env` and `defaultConnection.json`. When set, replaces the default path entirely.

At startup, the container writes its settings to this folder: always `.env`, and `defaultConnection.json` too when a default connection is configured. The folder must be writable by the container, or it refuses to start. See [Graph Explorer can't start because it can't write .env](../guides/troubleshooting.md#graph-explorer-cant-start-because-it-cant-write-env) if you hit this.

Mounting `config.json` read-only at `/graph-explorer/config.json` (see [JSON Configuration Approach](#json-configuration-approach)) is unaffected, since that file lives outside the configuration folder.

- Optional
- Default: `<client root>` (`packages/graph-explorer`)
- Type: `string`

## Default Connection

To provide a default connection such that initial loads of Graph Explorer always result with the same starting connection, modify the `docker run ...` command to either take in a JSON configuration or runtime environment variables. If you provide both a JSON configuration and environmental variables, the JSON will be prioritized.

> [!NOTE]
>
> The legacy `PUBLIC_OR_PROXY_ENDPOINT` and `USING_PROXY_SERVER` variables are still honored, so an existing deployment needs no change:
>
> - `USING_PROXY_SERVER=true` (case-insensitive): the default connection goes through the proxy server to `GRAPH_CONNECTION_URL`, and `PUBLIC_OR_PROXY_ENDPOINT` is ignored.
> - `USING_PROXY_SERVER` set to any other value, or unset with `PUBLIC_OR_PROXY_ENDPOINT` provided: the default connection is a direct connection to `PUBLIC_OR_PROXY_ENDPOINT`, or to `GRAPH_CONNECTION_URL` when `PUBLIC_OR_PROXY_ENDPOINT` is unset. The browser sends its requests to the database itself, and `IAM`, `AWS_REGION`, and `SERVICE_TYPE` are ignored.
> - `USING_PROXY_SERVER` and `PUBLIC_OR_PROXY_ENDPOINT` both unset: the default connection goes through the proxy server to `GRAPH_CONNECTION_URL`.
>
> `PUBLIC_OR_PROXY_ENDPOINT` is a legacy alias for the database URL of a direct default connection. Prefer `GRAPH_CONNECTION_URL`, and set `USING_PROXY_SERVER=false` only when the default connection should connect from the browser.

### Environment Variables

These are the valid environment variables used for the default connection, their defaults, and their descriptions.

- Required:
  - `GRAPH_CONNECTION_URL` - `None` - The URL of the graph database endpoint.
- Optional
  - `GRAPH_TYPE` - `None` - If not specified, multiple connections will be created for every available query language.
  - `IAM` - `False`
  - `PROXY_SERVER_HTTPS_CONNECTION` - `True` - Controls whether the server uses SSL or not
  - `GRAPH_EXP_FETCH_REQUEST_TIMEOUT` - `240000` - Controls the timeout for the fetch request. Measured in milliseconds (i.e. 240000 is 240 seconds or 4 minutes).
  - `GRAPH_EXP_NODE_EXPANSION_LIMIT` - `None` - Controls the limit for node counts and expansion queries.
- Conditionally Required:
  - Required if `IAM=True`
    - `AWS_REGION` - `None`
    - `SERVICE_TYPE` - `neptune-db`, Set this as `neptune-db` for Neptune database or `neptune-graph` for Neptune Analytics.

### JSON Configuration Approach

First, create a `config.json` file containing values for the connection attributes:

```json
{
  "GRAPH_CONNECTION_URL": "https://{your-cluster-id}.us-west-2.neptune.amazonaws.com:8182",
  "IAM": true,
  "SERVICE_TYPE": "neptune-db",
  "AWS_REGION": "us-west-2",
  "GRAPH_TYPE": "gremlin",
  "PROXY_SERVER_HTTPS_CONNECTION": true,
  "GRAPH_EXP_FETCH_REQUEST_TIMEOUT": 240000,
  "GRAPH_EXP_NODE_EXPANSION_LIMIT": 500
}
```

`GRAPH_TYPE` accepts `"gremlin"`, `"sparql"`, or `"openCypher"`. `GRAPH_EXP_FETCH_REQUEST_TIMEOUT` is measured in milliseconds (e.g., 240000 is 4 minutes).

Pass the `config.json` file path to the `docker run` command.

```bash
docker run -p 443:443 \
 --env HOST={hostname-or-ip-address} \
 -v /path/to/config.json:/graph-explorer/config.json \
 public.ecr.aws/neptune/graph-explorer
```

This publishes Graph Explorer on every network interface of the host. Limit who can reach it as described in [Access Control](./security.md#access-control).

### Environment Variable Approach

Provide the desired connection variables directly to the `docker run` command, as follows:

```bash
docker run -p 443:443 \
 --env HOST={hostname-or-ip-address} \
 --env GRAPH_CONNECTION_URL=https://{your-cluster-id}.us-west-2.neptune.amazonaws.com:8182 \
 --env GRAPH_TYPE=gremlin \
 --env IAM=true \
 --env AWS_REGION=us-west-2 \
 --env SERVICE_TYPE=neptune-db \
 --env PROXY_SERVER_HTTPS_CONNECTION=true \
 --env GRAPH_EXP_FETCH_REQUEST_TIMEOUT=240000 \
 --env GRAPH_EXP_NODE_EXPANSION_LIMIT=500 \
 public.ecr.aws/neptune/graph-explorer
```

This publishes Graph Explorer on every network interface of the host. Limit who can reach it as described in [Access Control](./security.md#access-control).
