# Connection links via a dedicated `#/connect` route

Date: 2026-06-12

## Status

Accepted

## Context

External applications want to deep-link into Graph Explorer with a connection
already configured — for example, a console that lists Neptune clusters and
offers an "Open in Graph Explorer" link. The link carries the endpoint and auth
details as URL parameters. Graph Explorer stores all connections client-side and
has no server, so the link is the only channel for this hand-off.

Three decisions in this design are non-obvious and would otherwise invite "why
is it like this?" later.

## Decisions

### A dedicated `#/connect` route, not an interstitial gate

An earlier version mounted a `UrlConnectionGate` component high in the tree that
read `window.location`, froze the resolved intent at mount with `useState`, and
stripped the params via `history.replaceState`. That coupled a reactive
computation to a one-shot lifecycle and put connection-handling logic in the app
shell.

Connection links are now a first-class route, `#/connect?graphDbUrl=…`. The
route resolves the params once on entry and redirects (router `navigate`, with
`replace`) to the graph canvas on completion. Because Graph Explorer uses a hash
router, the parameters sit **after** the `#` like every other route — third-party
integrators build the link the same way they would any in-app link, and
`window.location.search` (everything before the `#`) is no longer a trap. The
redirect leaves no `#/connect` entry in history, so refresh and back behave
normally without any manual param stripping.

### Auth posture is part of connection identity

A link resolves to one of four intents against the existing connections:
`none` (it targets the active connection — do nothing), `activate` (it matches an
inactive connection — switch to it), `create` (no match — open a pre-filled
form), or `invalid` (the link's `graphDbUrl` failed validation — warn and ignore
it). A connection matches only when its `graphDbUrl`, `queryEngine`, **and auth
posture** all agree, where auth posture is IAM on/off and, when on, the region
and service type.

Auth posture is identity-bearing because activating the wrong-auth connection
would silently connect with credentials the link did not ask for. A link
requesting IAM in `us-east-1` must not reuse a plaintext connection to the same
endpoint, and vice versa. When posture differs, the link falls through to the
`create` form rather than silently reusing a connection.

### Switching to an existing connection needs no confirmation

The `activate` path switches connections with no dialog. This matches how the
connections list already works — clicking a connection there activates it on a
single click, resetting the graph session, with no prompt. The link only ever
activates a connection the user already created and validated, so there is
nothing new to confirm. Adding a prompt here would guard an operation the rest
of the app treats as routine.

The `create` path keeps its friction: the pre-filled form is fully editable and
the user must submit it. This is the deliberate trust gate for the untrusted
endpoint details a link can carry — it is the only path that can introduce a new
database, so it is the only one that asks the user to confirm.

## Consequences

- The contract other code and external integrators depend on is the parameter
  set (`graphDbUrl`, `queryEngine`, `awsRegion`, `serviceType`, `name`) and the
  four-intent model, both in `core/urlConnectionParams.ts`. Parameters are
  validated with zod; `graphDbUrl` must be an http(s) URL or the link is ignored.
- A connection from a link always proxies through the same host that serves
  Graph Explorer. The proxy base URL is derived from `document.baseURI` rather
  than `window.location.origin`, so it keeps the path prefix of path-hosted
  deployments (e.g. a Neptune notebook at `/proxy/9250/explorer/` resolves the
  proxy to `/proxy/9250`). There is no parameter to target a different proxy
  host or to make a direct, non-proxy connection. (When the connection model
  drops the explicit proxy `url` in favor of always-relative requests — see
  PR #1773 — this derivation goes away and links inherit that behavior.)
- A link can switch to or pre-fill a connection, but it can never create or
  connect to a new database without the user submitting the form. The proxy
  server's `PROXY_SERVER_ALLOWED_DB_ORIGINS` allowlist remains the unconditional
  backstop regardless of what a link requests. See
  [security reference](../references/security.md).
- Parameters are plaintext, not an encoded token. This was deliberate: links are
  meant to be human-readable and constructible by any integrator. The trust gate
  is the create form plus the proxy allowlist, not obscurity.
- Active-connection state is currently global. A separate workstream makes it
  per-tab; this route is written against the current global behavior and does
  not bake in cross-tab assumptions.

## User-facing documentation

[Connections feature → Connection Links](../features/connections.md#connection-links)
documents the parameters, an example link, and the resolved behavior.
