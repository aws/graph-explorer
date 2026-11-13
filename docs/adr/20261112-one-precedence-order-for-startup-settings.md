# ADR: One precedence order for startup settings

- **Status:** Accepted
- **Date:** 2026-11-12
- **Updated:** 2026-11-13: the Default Connection settings come from `.env` and `.env.local` too, in the same order.
- **Related:** #1670, [Refuse the Neptune Notebook preset when HTTPS is requested](./20260925-refuse-neptune-notebook-https-conflict.md), [Unify Docker image by removing SageMaker variant](./20260616-unify-docker-image-remove-sagemaker-variant.md). Affects `resolveStartupConfig` in `packages/graph-explorer-proxy-server/src/startup-config.ts`, `packages/graph-explorer-proxy-server/src/env.ts`, and the Precedence section of `packages/docs/src/content/docs/references/configuration.mdx`.

## Context

The image reads its startup settings from five places: the environment (`-e` flags), `.env.local`, `config.json`, `.env`, and each setting's default. Earlier versions had no single order between them. The startup scripts copied `config.json` into `.env`, and when the file existed they took every key it can hold from it, even the keys it left out, so `config.json` beat `-e` for the Default Connection settings and `NEPTUNE_NOTEBOOK`. The server then read `.env` with dotenv, which never overrides a variable already set, so `-e` beat `config.json` for `PROXY_SERVER_HTTPS_CONNECTION`. The certificate step read `.env` with its own `grep`, so one deployment could generate a certificate from one value and serve from another.

The docs had said "If you provide both a JSON configuration and environmental variables, the JSON will be prioritized" since 2023. That held for the Default Connection settings and the certificate step, and not for how the server listened.

## Decision

Every setting comes from the first of these that sets it:

1. The environment, such as `-e` flags.
2. `.env.local`.
3. `config.json`, or the Neptune Notebook preset's port, log style, and HTTPS off.
4. `.env`.
5. The setting's default.

`config.json` behaves as if it were one more dotenv file loaded between `.env.local` and `.env`, so the environment beats it one key at a time, and a key it leaves out falls back to the environment.

- This reverses "the JSON will be prioritized" for the Default Connection settings and `NEPTUNE_NOTEBOOK`.
- An empty environment value for a key `config.json` can hold, such as `-e GRAPH_CONNECTION_URL=`, counts as unset, so it doesn't hide the `config.json` value.
- `NEPTUNE_NOTEBOOK` comes only from the environment or `config.json`, never from `.env` or `.env.local`, as before.
- The Default Connection settings follow the same order one key at a time, so a connection can take its keys from more than one place before it is set up as proxied or direct.
- `HOST`, which names the host the self-signed certificate is generated for, comes from the environment only, so a `HOST` in `.env` never replaces certificate files kept in a volume.
- With `-e NEPTUNE_NOTEBOOK=true`, the preset applies even when `config.json` exists. When `PROXY_SERVER_HTTPS_CONNECTION` is also `true`, startup stops with the conflict the earlier ADR describes.

## Considered options

- **One order, with `config.json` between `.env.local` and `.env` (chosen).** It matches how tools such as Docker Compose, Viper, and Spring Boot let the command line or environment beat a config file. It changes outcomes only where `-e` and `config.json` disagree, or where `-e` sets a key `config.json` leaves out, both setups that already behaved inconsistently.
- **Keep `config.json` first.** Rejected because the environment, `.env.local`, and `.env` belong side by side, the notebook preset itself comes from an environment variable, and the server's HTTPS already let `-e` beat `config.json`.
- **Drop `config.json`.** Rejected for this change, because deployments mount it and the docs tell them to.
- **Refuse to start when `config.json` and `.env` disagree on HTTPS.** Rejected because the order gives every setting a single answer.

## Consequences

- A deployment where an `-e` flag and `config.json` set the same setting to different values now gets the `-e` value. The upgrade notes say to remove the flag to keep the `config.json` value.
- A deployment that sets `-e NEPTUNE_NOTEBOOK=true` and mounts a `config.json` now runs under the preset, on HTTP and port 9250.
- An `-e` flag and `config.json` can no longer give the server's HTTPS and the certificate step different values.
