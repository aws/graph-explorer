# ADR: Listen on loopback when run from source

- **Status:** Accepted
- **Date:** 2026-10-27
- **Related:** [Document the supported hosting model](./20261022-document-supported-hosting-model.md). Affects `packages/graph-explorer-proxy-server/src/env.ts`, `server-lifecycle.ts`, the `Dockerfile`, and `.github/workflows/test_build_docker.yml`.

## Context

The proxy server listened on every network interface wherever it ran. In a container that's required, because a published port reaches the server through the container's own interface. Running from source, the server only needs to accept connections from the machine it runs on, which is what the supported hosting model allows for plain HTTP.

## Decision

`PROXY_SERVER_LISTEN_ADDRESS` chooses the address the proxy server listens on. It takes an IP literal.

- The code default is `127.0.0.1`, so `pnpm start`, `pnpm dev`, and `node src/node-server.ts` accept connections from the local machine only.
- The image's final stage sets `ENV PROXY_SERVER_LISTEN_ADDRESS=::`, so the container keeps listening on every interface.
- `::` and `0.0.0.0` call `listen` with no host. Node then binds IPv6 first and falls back to IPv4 on hosts without IPv6.
- An empty value or a hostname fails the env parse at startup and names the variable.
- The startup log names the address and port the server bound. On loopback it adds that only this machine can connect and how to widen it.
- A permission error and an unavailable address each get a message that names the setting to change.

## Considered options

- **Keep every interface and only add the variable.** Rejected because running from source stays reachable by default.
- **A `NODE_ENV` check.** Rejected because `pnpm start` sets `NODE_ENV=production` just as the entrypoint does, so it would keep `pnpm start` on every interface.
- **Set the value on the entrypoint's start line.** Rejected because `--entrypoint` overrides, forked entrypoints, and images built `FROM` ours bypass it.
- **`0.0.0.0` as the image value.** Equivalent, since both listen with no host. `::` is used because it states the dual-stack intent and matches the `[::]` the startup log prints.
- **A literal `listen(port, "::")`.** Rejected because it has no IPv4 fallback on hosts with IPv6 disabled.
- **Accepting hostnames.** Rejected because a name can resolve to several addresses or change, and the log wouldn't show what was bound.

## Consequences

- `pnpm start` and `pnpm dev`'s proxy server listen on `127.0.0.1`. The Vite dev server still listens on every interface.
- On macOS, running from source needs a port of 1024 or higher, because only root can listen below that on `127.0.0.1`.
- Images built without our `Dockerfile` need the `ENV`, or their published port stops answering.
- An empty `-e PROXY_SERVER_LISTEN_ADDRESS=` fails at startup instead of silently listening on loopback.
- CI checks the image listens on every interface, including a start that bypasses the entrypoint.
