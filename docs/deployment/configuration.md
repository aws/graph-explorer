# Configuration

This guide covers the environment variables and configuration options available
for Graph Explorer deployment.

## Environment Variables

### `GRAPH_EXP_ENV_ROOT_FOLDER`

Base path used to serve the `graph-explorer` front end application.

Example: `/explorer`

- Optional
- Default: `/`
- Type: `string`

### `GRAPH_EXP_CONNECTION_NAME`

Default connection name.

- Optional
- Default is empty
- Type: `string`

### `GRAPH_EXP_CONNECTION_ENGINE`

The query engine to use for the default connection.

- Optional
- Default is `gremlin`
- Valid values are `gremlin`, `openCypher`, or `sparql`
- Type: `string`

### `HOST`

The public hostname of the server. This is used to generate the SSL certificate
during the Docker build.

Example: `localhost`

- Required when using HTTPS connections
- Default is empty
- Type: `string`

### `GRAPH_EXP_HTTPS_CONNECTION`

Uses the self-signed certificate to serve Graph Explorer over https if true.

- Optional
- Default `true`
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
- Default `true`
- Type: `boolean`
