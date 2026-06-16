# Unify Docker Image by Removing SageMaker Variant

## Status

Accepted

## Context

Graph Explorer ships two Docker images from the same Dockerfile: a main image and a
SageMaker image built with `--build-arg NEPTUNE_NOTEBOOK=true`. The build argument
bakes different environment variable defaults into the image (port 9250 instead of 80,
cloudwatch logging, a different Vite `base` path for static assets). The SageMaker
lifecycle script already passes all these values as runtime environment variables,
making the build-time split unnecessary.

Additionally, the client requires users to manually specify a "Public or Proxy
Endpoint" URL even though the proxy server and UI are always served from the same
origin. This creates confusion and an extra configuration step that can be derived
automatically.

## Decision

Eliminate the separate SageMaker image by:

1. **Using relative asset paths** — set Vite `base: "./"` and add `<base href="./">`
   to `index.html`. This makes the compiled frontend work behind any reverse proxy
   without build-time knowledge of the path prefix.

2. **Using relative fetch paths** — the client fetches API routes (sparql, gremlin,
   openCypher, defaultConnection, etc.) via `new URL("../sparql", document.baseURI)`
   instead of constructing absolute URLs from a configured proxy endpoint. The server
   mounts static files at `/explorer` and API routes at `/`, so `../` from the static
   directory always resolves to the API root.

3. **Always routing through the proxy** — remove the `proxyConnection` toggle and
   `url` (proxy endpoint) from the connection model. The client always sends requests
   to the same-origin proxy server. The connection config simplifies to: database
   endpoint, query engine, and optional IAM settings.

4. **Moving SageMaker defaults to runtime** — `process-environment.sh` reads
   `NEPTUNE_NOTEBOOK=true` at container startup and writes port/log-style/SSL
   settings to `.env`. The Dockerfile no longer sets these, allowing the app's
   built-in defaults (port 80, default log style) to apply when the variable is absent.

5. **Publishing dual tags during transition** — CI builds one image and publishes it
   under both the regular tag and the `sagemaker-*` tag, so existing lifecycle scripts
   continue working without modification.

## Consequences

### Positive

- One image to build, test, scan, and publish — halves CI time for Docker.
- Users no longer need to figure out or configure the proxy server URL.
- The connection form simplifies to just the database endpoint and auth settings.
- Deployments behind arbitrary reverse proxies (not just Jupyter) work without
  build-time configuration.
- Removes ~20 lines of conditional Dockerfile logic and the two-path defaultConnection
  fallback hack in the client.

### Negative

- Relative paths create a fixed contract: the API root is always one directory above
  the static files mount. This is enforced in one place (`server-config.ts`) so drift
  is unlikely but possible.
- Legacy stored connections (localStorage) need a read-time migration:
  `graphDbUrl = old.proxyConnection ? old.graphDbUrl : old.url`.
- The `sagemaker-*` tags must be published for several release cycles until existing
  deployed lifecycle scripts are updated.
- The proxy server must have network access to the target database. Deployments in
  restricted networks (e.g., private subnets without a NAT gateway) cannot reach
  databases outside that network — even if the user's browser previously could via
  direct connections. Users in this scenario need to add network routing.

### Neutral

- `NEPTUNE_NOTEBOOK` remains as a runtime convenience preset (sets port, log style,
  disables SSL). It is not written to `.env` itself — only its side effects are
  applied.
- Extra environment variables passed by old deployments (`PUBLIC_OR_PROXY_ENDPOINT`,
  `USING_PROXY_SERVER`) are silently ignored — no errors.

## Changes Required

### Dockerfile

- Remove `ARG NEPTUNE_NOTEBOOK` and all conditional ENV logic
- Remove `GRAPH_EXP_ENV_ROOT_FOLDER`
- Remove `ENV PROXY_SERVER_HTTP_PORT` and `ENV LOG_STYLE` (defaults from `env.ts`)
- Keep `EXPOSE 80`, `EXPOSE 443`, `EXPOSE 9250`

### Frontend Build

- `vite.config.ts`: `base: "./"`
- `index.html`: add `<base href="./">`

### Client Code

- Explorers use `new URL("../sparql", document.baseURI)` etc.
- `defaultConnection.ts`: single relative fetch, remove SageMaker fallback
- `RELOAD_URL` becomes `"."`
- Remove `proxyConnection` and `url` from `ConnectionConfig`
- `graphDbUrl` is the canonical database URL field
- `fetchDatabaseRequest.ts`: always send `graph-db-connection-url` header
- Read-time normalization for legacy data

### Client UI

- Connection form: remove proxy endpoint and proxy toggle, always show "Graph
  Connection URL" field and IAM toggle
- Connection display components: simplify to `graphDbUrl`

### Server

- `process-environment.sh`:
  - Remove `PUBLIC_OR_PROXY_ENDPOINT` / `USING_PROXY_SERVER` handling
  - When `NEPTUNE_NOTEBOOK=true`: write `PROXY_SERVER_HTTP_PORT=9250` and
    `LOG_STYLE=cloudwatch` to `.env` (respecting explicit overrides), force SSL off
  - Stop writing `NEPTUNE_NOTEBOOK` to `.env`

### CI

- Build one image, publish under regular + `sagemaker-*` tags
- Remove `--build-arg NEPTUNE_NOTEBOOK=true` step

### Lifecycle Script

Existing lifecycle scripts continue working unchanged — they pull `sagemaker-*` tags
(now an alias for the regular image) and pass `PUBLIC_OR_PROXY_ENDPOINT` /
`USING_PROXY_SERVER` env vars which the unified image silently ignores.

The bundled example script in this repo is updated to:

- Pull regular tag instead of `sagemaker-*`
- Remove `PUBLIC_OR_PROXY_ENDPOINT` and `USING_PROXY_SERVER` from `docker run`

### Documentation

- `docs/references/configuration.md`
- `docs/guides/deploy-to-ecs-fargate.md`
- `docs/guides/deploy-to-sagemaker.md`
- `docs/guides/deploy-with-docker.md`
- `docs/features/connections.md`
- `docs/architecture.md`
