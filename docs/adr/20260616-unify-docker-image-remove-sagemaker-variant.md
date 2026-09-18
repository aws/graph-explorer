# ADR — Unify Docker image by removing SageMaker variant

- **Status:** Accepted
- **Date:** 2026-06-16
- **Related:** ADR `read-time-transform-for-persisted-values` (legacy stored connections' read-time transform for `graphDbUrl`)

## Context

Graph Explorer ships two Docker images from the same Dockerfile: a main image and a SageMaker image built with `--build-arg NEPTUNE_NOTEBOOK=true`. The build argument bakes different environment variable defaults into the image (port 9250 instead of 80, cloudwatch logging, a different Vite `base` path for static assets). The SageMaker lifecycle script already passes all these values as runtime environment variables, making the build-time split unnecessary.

Additionally, the client requires users to manually specify a "Public or Proxy Endpoint" URL even though the proxy server and UI are always served from the same origin. This creates confusion and an extra configuration step that can be derived automatically.

## Decision

Eliminate the separate SageMaker image by:

1. **Using relative asset paths** — set Vite `base: "./"` and add `<base href="./">` to `index.html`. This makes the compiled frontend work behind any reverse proxy without build-time knowledge of the path prefix.

2. **Using relative fetch paths** — the client fetches API routes (sparql, gremlin, openCypher, defaultConnection, etc.) via `new URL("../sparql", document.baseURI)` instead of constructing absolute URLs from a configured proxy endpoint. The server mounts static files at `/explorer` and API routes at `/`, so `../` from the static directory always resolves to the API root.

3. **Always routing through the proxy** — remove the `proxyConnection` toggle and `url` (proxy endpoint) from the connection model. The client always sends requests to the same-origin proxy server. The connection config simplifies to: database endpoint, query engine, and optional IAM settings.

4. **Moving SageMaker defaults to runtime** — `process-environment.sh` reads `NEPTUNE_NOTEBOOK=true` at container startup and writes port/log-style/SSL settings to `.env`. The Dockerfile no longer sets these, allowing the app's built-in defaults (port 80, default log style) to apply when the variable is absent.

5. **Publishing dual tags during transition** — CI builds one image and publishes it under both the regular tag and the `sagemaker-*` tag, so existing lifecycle scripts continue working without modification.

## Considered options

- **Keep the two images.** Costs double CI build and vulnerability-scan time, and forces the SageMaker lifecycle script to track a separate tag lineage.
- **Keep `proxyConnection` as an advanced opt-in while still unifying the image.** The relative-URL work alone unifies the image, so this was possible on its own. It costs keeping two request paths permanently, and keeping the feature gates that made the direct path quietly worse than the proxy path.
- **Derive the proxy endpoint automatically but keep the field.** Removes the configuration burden without removing the concept, leaving a vestigial field in the Connection model and in every exported file.
- **Move the database endpoint into server configuration entirely, so the browser never names a database URL.** This would close the open-proxy exposure that `PROXY_SERVER_ALLOWED_DB_ORIGINS` currently patches, but it contradicts the client-owns-its-connections model described in `docs/agents/product.md`, and it is a much larger change.

The second option, keeping `proxyConnection` as an opt-in, was the closest alternative, and it was rejected on specific evidence rather than preference.

Amazon Neptune sends no CORS headers, so a browser could never reach Neptune directly. A maintainer confirms this on issue [#244](https://github.com/aws/graph-explorer/issues/244): the proxy server is required for accessing Neptune, even with local VPC access. The direct path did work against public, CORS-permissive SPARQL endpoints, and that was a deliberate investment. See issue [#530](https://github.com/aws/graph-explorer/issues/530) with PR [#529](https://github.com/aws/graph-explorer/pull/529), and issue [#393](https://github.com/aws/graph-explorer/issues/393). Routing those through the proxy still works, because a container with internet access reaches a public endpoint fine, so nothing is lost for them.

The direct path also silently lacked IAM authentication, because the IAM controls rendered only when `proxyConnection` was set. It also lacked query cancellation, server-side logging, proxy retries, and `PROXY_SERVER_ALLOWED_DB_ORIGINS` enforcement. Issue [#1599](https://github.com/aws/graph-explorer/issues/1599), the most recent report touching it, treats the direct path firing as a bug. Removing it was already decided: see issue [#1618](https://github.com/aws/graph-explorer/issues/1618) as the parent, with [#1622](https://github.com/aws/graph-explorer/issues/1622) and [#1625](https://github.com/aws/graph-explorer/issues/1625), and [#539](https://github.com/aws/graph-explorer/issues/539), open since August 2024. No open issue asks to preserve direct connections.

## Consequences

### Positive

- One image to build, test, scan, and publish — halves CI time for Docker.
- Users no longer need to figure out or configure the proxy server URL.
- The connection form simplifies to just the database endpoint and auth settings.
- Deployments behind arbitrary reverse proxies (not just Jupyter) work without build-time configuration.
- Removes ~20 lines of conditional Dockerfile logic and the two-path defaultConnection fallback hack in the client.

### Negative

- Relative paths create a fixed contract: the API root is always one directory above the static files mount. This is enforced in one place (`server-config.ts`) so drift is unlikely but possible.
- Legacy stored connections (IndexedDB) need a read-time transform: `graphDbUrl = old.proxyConnection ? old.graphDbUrl : old.url`.
- The `sagemaker-*` tags must be published for several release cycles until existing deployed lifecycle scripts are updated.
- For now, the bundled SageMaker lifecycle script keeps pulling the `sagemaker-` prefixed tag and its minimum-version floor instead of switching to the unprefixed tag. CI publishes both tag families pointing at the identical image, so the prefixed tag is just an alias, and keeping it means the script's version floor still works and no existing notebook breaks. This is a transition-period choice, expected to be revisited once deployed notebooks have had time to move off the prefixed tag.
- The proxy server must have network access to the target database. Deployments in restricted networks (e.g., private subnets without a NAT gateway) cannot reach databases outside that network — even if the user's browser previously could via direct connections. Users in this scenario need to add network routing.

### Neutral

- `NEPTUNE_NOTEBOOK` remains as a runtime convenience preset (sets port, log style, disables SSL). It is not written to `.env` itself — only its side effects are applied.
- Extra environment variables passed by old deployments (`PUBLIC_OR_PROXY_ENDPOINT`, `USING_PROXY_SERVER`) are still honored. `process-environment.sh` resolves them into `GRAPH_CONNECTION_URL`, mirroring the client's `transformLegacyConnection`, so an existing deployment keeps its Default Connection with no change.
