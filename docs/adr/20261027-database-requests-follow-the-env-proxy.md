# ADR: Database requests follow Node's environment proxy

- **Status:** Accepted
- **Date:** 2026-10-27
- **Related:** Affects `packages/graph-explorer-proxy-server/src/blocked-addresses.ts` and `docs/references/security.md`.

## Context

Node 24's global agents send requests through `HTTP_PROXY` and `HTTPS_PROXY` (the lowercase `http_proxy` and `https_proxy` take precedence), honoring `NO_PROXY` (a non-empty `no_proxy` replaces it), when `NODE_USE_ENV_PROXY=1` or `--use-env-proxy` is set. Database requests used those agents.

The proxy server now sends database requests through its own agents, whose lookup checks every address a host name resolves to (see [Reserved Cloud Service Addresses](../references/security.md#reserved-cloud-service-addresses)). A custom agent connects directly unless it is given `proxyEnv`, so a deployment whose only route to the database is a forward proxy would stop working.

## Decision

The database agents take the same `proxyEnv` as Node's global agents. Node reads the environment proxy settings at startup, so the `.env` and `.env.local` files in the configuration folder, which the server loads afterwards, can't set `NODE_USE_ENV_PROXY`, the proxy URLs, or `no_proxy`. With an env proxy on, the forward proxy resolves database host names, so the lookup check doesn't run for proxied requests. The IP literal check still applies to every request.

Hosts matched by `no_proxy`, or by `NO_PROXY` when `no_proxy` is unset or empty, connect directly and get the lookup check. For proxied host names, the forward proxy owns refusing reserved addresses.

## Considered options

- **Follow the env proxy (chosen).** Deployments that reach the database through the forward proxy keep working.
- **Ignore the env proxy.** Rejected because it breaks deployments that reach the database only through the forward proxy, and this release aims to break no documented setup.
- **Resolve the host locally before sending it to the proxy.** Rejected because the forward proxy resolves again and can get a different answer. It also breaks networks where only the forward proxy can resolve database host names.

## Consequences

- Env proxy deployments keep working.
- `docs/references/security.md` tells operators that refusing reserved addresses for proxied host names is up to the forward proxy.
- The forward proxy is the only control that refuses reserved addresses for proxied host names.
