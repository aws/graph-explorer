# Connection links via a dedicated `#/connect` route

Date: 2026-06-12

## Status

Accepted

## Context

External applications want to deep-link into Graph Explorer with a connection already configured — for example, a console that lists Neptune clusters and offers an "Open in Graph Explorer" link. The link carries the endpoint and auth details as URL parameters. Graph Explorer stores all connections client-side and has no server, so the link is the only channel for this hand-off.

Three decisions in this design are non-obvious and would otherwise invite "why is it like this?" later.

## Decisions

### A dedicated `#/connect` route, not an interstitial gate

An earlier version mounted a `ConnectionLinkGate` component high in the tree that read `window.location`, froze the resolved intent at mount with `useState`, and stripped the params via `history.replaceState`. That coupled a reactive computation to a one-shot lifecycle and put connection-handling logic in the app shell.

Connection links are now a first-class route, `#/connect?graphDbUrl=…`. Because Graph Explorer uses a hash router, the parameters sit **after** the `#` like every other route — third-party integrators build the link the same way they would any in-app link, and `window.location.search` (everything before the `#`) is no longer a trap. The route redirects (router `navigate`, with `replace`) away on completion, leaving no `#/connect` entry in history, so refresh and back behave normally without any manual param stripping.

### Opening a link is an action, not a derived value

The route resolves the link exactly once, in a `useState` initializer, and the resulting intent is the component's initial state. An effect then acts on it.

Deriving the intent on every render was the first attempt, and it inverted the problem rather than solving it: the resolved intent allocated a fresh object each render, so the effect acting on it needed either `useEffectEvent` or a snapshot to avoid re-firing. Resolving inside the effect and calling `setState` for the create case is the same mistake wearing a different hat — it decides during render's aftermath what could have been decided before the first paint, and the lint rule against `setState` in an effect says so.

Opening a link is a single event with a single decision. Making that decision the initial state says exactly that, and it means the create form is on screen from the first render instead of appearing one render later.

`resolveConnectionLinkIntent` remains a pure function over a link plus the current connections, so the four-intent contract is unit-tested in isolation; only the wiring lives in the route. Resolving in the initializer is safe because `AppStatusLoader` gates the route behind a spinner until the default connections have loaded — otherwise a one-shot resolution could miss a connection that was still arriving. There is a test pinning that ordering.

### Auth posture is part of connection identity

A link resolves to one of four intents against the existing connections: `none` (it targets the active connection — do nothing), `activate` (it matches an inactive connection — switch to it), `create` (no match — open a pre-filled form), or `invalid` (a param failed validation, such as an unsupported `queryEngine` or `serviceType`, or a malformed or credential-bearing `graphDbUrl` — warn naming each bad param and ignore the link). A connection matches only when its `graphDbUrl`, `queryEngine`, **and auth posture** all agree, where auth posture is IAM on/off and, when on, the region and service type.

Auth posture is identity-bearing because activating the wrong-auth connection would silently connect with credentials the link did not ask for. A link requesting IAM in `us-east-1` must not reuse a plaintext connection to the same endpoint, and vice versa. When posture differs, the link falls through to the `create` form rather than silently reusing a connection.

### Switching to an existing connection needs no confirmation

The `activate` path switches connections with no dialog. This matches how the connections list already works — clicking a connection there activates it on a single click, resetting the graph session, with no prompt. The link only ever activates a connection the user already created and validated, so there is nothing new to confirm. Adding a prompt here would guard an operation the rest of the app treats as routine.

Nor is there session data to protect. Sessions are stored per connection (`allGraphSessionsAtom`, keyed by connection id) and `useResetState` only clears the in-memory view atoms, so switching swaps which session is displayed rather than destroying the previous one — return to that connection and it restores. And a link cannot change an already-open window's state: following one opens a new tab, or the user pastes it deliberately. Either way the intent to start somewhere new is explicit.

The `create` path keeps its friction: the pre-filled form is fully editable and the user must submit it. This is the deliberate trust gate for the untrusted endpoint details a link can carry — it is the only path that can introduce a new database, so it is the only one that asks the user to confirm.

The form renders in place inside the app shell rather than as a portaled modal. A modal over an otherwise empty route left the user looking at a blank page behind the dialog. The route renders `DialogSurface`, the same panel `DialogContent` portals, inside a non-modal dialog that ignores outside clicks, so clicking the nav bar cannot silently discard the form. Saving lands on the graph view for the new connection. Escape and Cancel create nothing and land on the connections list, since declining the link leaves the user to choose a connection rather than dropping them into whichever one was active before.

## Consequences

- The contract other code and external integrators depend on is the parameter set (`graphDbUrl`, `queryEngine`, `awsRegion`, `serviceType`, `name`) and the four-intent model, both in `core/connectionLink.ts`. Parameters are validated with zod: an absent optional param takes its default, while an explicit unsupported value rejects the link, so a link never connects with settings it did not ask for.
- A connection from a link always proxies through the same host that serves Graph Explorer. The proxy base URL is derived from `document.baseURI` rather than `window.location.origin`, so it keeps the path prefix of path-hosted deployments (e.g. a Neptune notebook at `/proxy/9250/explorer/` resolves the proxy to `/proxy/9250`). There is no parameter to target a different proxy host or to make a direct, non-proxy connection. (When the connection model drops the explicit proxy `url` in favor of always-relative requests — see PR #1773 — this derivation goes away and links inherit that behavior.)
- A link can switch to or pre-fill a connection, but it can never create or connect to a new database without the user submitting the form. Connections a link creates always route through the proxy, so `PROXY_SERVER_ALLOWED_DB_ORIGINS` also bounds what a link can reach when that variable is set. It is unset by default, and a link that matches a connection configured to contact the database directly bypasses the proxy as any direct connection does. See [security reference](../references/security.md).
- Parameters are plaintext, not an encoded token. This was deliberate: links are meant to be human-readable and constructible by any integrator. The trust gate is the create form plus the proxy allowlist, not obscurity.
- The active connection is scoped per tab (see [Per-tab Active Connection ADR](20260618-per-tab-active-connection.md)): it lives in that tab's `sessionStorage`, seeded at cold start from a shared, last-writer-wins breadcrumb. A link resolves and activates against the tab it opens in, so it never changes what another open tab is viewing.

## User-facing documentation

[Connections feature → Connection Links](../features/connections.md#connection-links) documents the parameters, an example link, and the resolved behavior.
