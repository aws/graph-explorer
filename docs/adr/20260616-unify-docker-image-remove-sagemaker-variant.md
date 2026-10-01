# ADR — Unify Docker image by removing SageMaker variant

- **Status:** Accepted
- **Date:** 2026-06-16
- **Related:** ADR `read-time-transform-for-persisted-values` (legacy stored connections' read-time transform for `graphDbUrl`)

## Context

Graph Explorer ships two Docker images from the same Dockerfile: a main image and a SageMaker image built with `--build-arg NEPTUNE_NOTEBOOK=true`. The build argument bakes different environment variable defaults into the image (port 9250 instead of 80, cloudwatch logging, a different Vite `base` path for static assets). The SageMaker lifecycle script already passes all these values as runtime environment variables, making the build-time split unnecessary.

Additionally, the client requires users to manually specify a "Public or Proxy Endpoint" URL even though the proxy server and UI are always served from the same origin. This creates confusion and an extra configuration step that can be derived automatically.

## Decision

Eliminate the separate SageMaker image by:

1. **Using relative asset paths** — set Vite `base: "./"`. This makes the compiled frontend work behind any reverse proxy without build-time knowledge of the path prefix.

2. **Resolving API routes from the document's own path** — the client builds API routes (sparql, gremlin, openCypher, defaultConnection, etc.) with `apiUrl()`, which cuts the last occurrence of the static mount segment (`STATIC_MOUNT_PATH`, `/explorer`) out of `location.pathname` and joins the endpoint onto what is left, against `location.origin`. The server mounts static files at `/explorer` and API routes at `/`, so removing that segment lands on the API root at any external prefix. A path that has no mount segment at all means a reverse proxy renamed it away, and that throws `ReverseProxyMisconfiguredError` rather than guessing. `fetchDatabaseRequest()` resolves database routes with `apiUrl()` for every connection except a deprecated direct one (see decision 3).

3. **Routing through the proxy by default, and deprecating direct connections** — remove `url` (proxy endpoint) from the connection model. The client sends requests to the same-origin proxy server, and the connection config simplifies to: database endpoint, query engine, and optional IAM settings. Direct connections stay available for now as a deprecated opt-in, marked `proxyConnection: false`, where the browser calls `graphDbUrl` itself without the proxy-only headers. A follow-up change removes the opt-in once feedback allows.

4. **Moving SageMaker defaults to runtime** — `process-environment.sh` reads `NEPTUNE_NOTEBOOK=true` at container startup and writes port/log-style/SSL settings to `.env`. The Dockerfile no longer sets these, allowing the app's built-in defaults (port 80, default log style) to apply when the variable is absent.

5. **Publishing dual tags during transition** — CI builds one image and publishes it under both the regular tag and the `sagemaker-*` tag, so existing lifecycle scripts continue working without modification.

## Considered options

- **Keep the two images.** Costs double CI build and scan time, and forces the SageMaker lifecycle script to track a separate tag lineage.
- **Resolve API routes against `document.baseURI` instead.** `new URL("../sparql", document.baseURI)` needs no string surgery on the path, and once the app has loaded it gives the same answer, since the app's own scripts resolve the same way and only load when the page path ends in the mount directory. It still needs `STATIC_MOUNT_PATH` to notice a reverse proxy that renamed the mount away, so it saves little. Cutting the segment out of `location.pathname` was kept because it states the mount contract directly, in one place shared with the server, and detects a renamed mount with the same mechanism. It also keeps working if the app ever moves from hash routing to real URL routes, but that isn't planned and didn't drive the choice.
- **Derive the proxy endpoint automatically but keep the field.** Removes the configuration burden without removing the concept, leaving a vestigial field in the Connection model and in every exported file. The exported connection file still writes `url`, but only as a write-only compatibility field for older importers (see Consequences), not as part of the model.
- **Move the database endpoint into server configuration entirely, so the browser never names a database URL.** This would remove the need for `PROXY_SERVER_ALLOWED_DB_ORIGINS`, but it contradicts the client-owns-its-connections model described in `docs/agents/product.md`, and it is a much larger change.

Keeping direct connections permanently, as an advanced opt-in, was the closest alternative. The relative-URL work alone unifies the image, so it was possible, but it costs two request paths and the feature gates that gave the direct path fewer capabilities than the proxy path. It was rejected on specific evidence rather than preference. This change keeps the opt-in, deprecated, only for a transition period, so anyone who depends on it has time to give feedback before the follow-up removes it.

Amazon Neptune sends no CORS headers, so a browser could never reach Neptune directly. A maintainer confirms this on issue [#244](https://github.com/aws/graph-explorer/issues/244): the proxy server is required for accessing Neptune, even with local VPC access. The direct path did work against public, CORS-permissive SPARQL endpoints, and that was a deliberate investment. See issue [#530](https://github.com/aws/graph-explorer/issues/530) with PR [#529](https://github.com/aws/graph-explorer/pull/529), and issue [#393](https://github.com/aws/graph-explorer/issues/393). Routing those through the proxy still works, because a container with internet access reaches a public endpoint fine, so nothing is lost for them.

The direct path also did not offer IAM authentication, because the IAM controls rendered only when `proxyConnection` was set. It also lacked query cancellation, server-side logging, and `PROXY_SERVER_ALLOWED_DB_ORIGINS` enforcement. Issue [#1599](https://github.com/aws/graph-explorer/issues/1599), the most recent report touching it, treats the direct path firing as a bug. Removing it was already decided: see issue [#1618](https://github.com/aws/graph-explorer/issues/1618) as the parent, with [#1622](https://github.com/aws/graph-explorer/issues/1622) and [#1625](https://github.com/aws/graph-explorer/issues/1625), and [#539](https://github.com/aws/graph-explorer/issues/539), open since August 2024. No open issue asks to preserve direct connections.

## Consequences

### Positive

- One image to build, test, scan, and publish — halves CI time for Docker.
- Users no longer need to figure out or configure the proxy server URL.
- The connection form simplifies to the database endpoint and auth settings, plus the deprecated direct option until the follow-up removes it.
- Deployments behind arbitrary reverse proxies (not just Jupyter) work without build-time configuration.
- Removes ~20 lines of conditional Dockerfile logic and the two-path defaultConnection fallback hack in the client.

### Negative

- Relative paths create a fixed contract: the API root is always one directory above the static files mount. The segment itself is declared once, as `STATIC_MOUNT_PATH` in `packages/shared/src/constants.ts`, but three readers apply it independently — `server-config.ts` mounts the static files under it, `app.ts` redirects the bare mount path to it, and the client's `apiUrl.ts` cuts it back out — so honoring the contract is spread across all three.
- A reverse proxy that renames the mount segment away, for example mapping an external `/gx/` straight onto the server's `/explorer/`, is unsupported. The page still renders, because assets resolve against a relative base, but nothing left in the path names the API root, so `apiUrl()` raises `ReverseProxyMisconfiguredError` instead of sending database requests somewhere wrong. A supported proxy forwards the client's `/explorer` segment intact, at whatever prefix depth it likes.
- Legacy stored connections (IndexedDB) need a read-time transform, `transformLegacyConnection`: a connection counts as proxied when `proxyConnection` is `true`, or when it's absent and `graphDbUrl` is already set. A proxied connection keeps its `graphDbUrl` and loses the flag. Otherwise the connection stays direct: the transform takes `url` (falling back to `graphDbUrl`), keeps `proxyConnection: false`, and drops the IAM fields, since those only ever applied to a proxied connection.
- The `sagemaker-*` tags must be published for several release cycles until existing deployed lifecycle scripts are updated.
- For now, the bundled SageMaker lifecycle script keeps pulling the `sagemaker-` prefixed tag and its minimum-version floor instead of switching to the unprefixed tag. CI publishes both tag families pointing at the identical image, so the prefixed tag is just an alias, and keeping it means the script's version floor still works and no existing notebook breaks. This is a transition-period choice, expected to be revisited once deployed notebooks have had time to move off the prefixed tag.
- The proxy server must have network access to the target database. Deployments in restricted networks (e.g., private subnets without a NAT gateway) cannot reach databases outside that network, even if the user's browser could. Users in this scenario need to add network routing, or use the deprecated direct option until it is removed.
- Until the follow-up removes it, the direct path stays a second request path, with its own URL resolution, header rules, and error message.

### Neutral

- `NEPTUNE_NOTEBOOK` remains as a runtime convenience preset (sets port, log style, disables SSL). `process-environment.sh` writes the flag itself to `.env` alongside those side effects, and `env.ts` parses it, because the server only ever sees the variable through `.env` and needs it to tell a notebook deployment apart from an explicit `PROXY_SERVER_HTTPS_CONNECTION=true`.
- Exported connection files still write the legacy `url` and an explicit `proxyConnection`, so builds from before this change can import them. Those builds require `url` and read a missing `proxyConnection` as direct. For a proxied connection `url` is the exporting page's proxy root (`apiUrl("")`), and for a direct one it is the database URL. The current importer drops `url` for a proxied connection. A file taken to another host points an older build at the exporter's proxy, the same as exports did before this change. Exporting fails with a message when a misconfigured reverse proxy hides the proxy root. Stop writing both fields once importing into builds from before this change is no longer supported.
- Extra environment variables passed by old deployments (`PUBLIC_OR_PROXY_ENDPOINT`, `USING_PROXY_SERVER`) are still honored. `process-environment.sh` resolves them into `GRAPH_CONNECTION_URL` and `GRAPH_EXP_USING_PROXY_SERVER` the way earlier versions read them, so an existing deployment keeps its Default Connection with no change. It's proxied to `GRAPH_CONNECTION_URL` when `USING_PROXY_SERVER` is `true`, or when `USING_PROXY_SERVER` is unset and `PUBLIC_OR_PROXY_ENDPOINT` isn't set. Otherwise it's direct to `PUBLIC_OR_PROXY_ENDPOINT`, falling back to `GRAPH_CONNECTION_URL`, because earlier versions treated an unset `USING_PROXY_SERVER` as false. A Default Connection that resolves to direct stays a deprecated direct connection, and the shell drops `GRAPH_EXP_IAM`, `GRAPH_EXP_AWS_REGION`, and `GRAPH_EXP_SERVICE_TYPE` from it, matching the client, because the browser sends its requests and nothing would sign them.
