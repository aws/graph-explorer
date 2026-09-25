# ADR: Refuse the Neptune Notebook preset when HTTPS is requested

- **Status:** Accepted
- **Date:** 2026-09-25
- **Related:** #2252. Affects `EnvironmentValuesSchema` in `packages/graph-explorer-proxy-server/src/env.ts`, `process-environment.sh`, and `docker-entrypoint.sh`.

## Context

`NEPTUNE_NOTEBOOK=true` is a preset for the SageMaker notebook image. It serves plain HTTP on port 9250, because the notebook proxy in front of it terminates TLS. `PROXY_SERVER_HTTPS_CONNECTION=true` asks the server to serve TLS itself. The two can't both hold.

Before this decision the conflict resolved differently depending on where the HTTPS request came from:

- **`-e PROXY_SERVER_HTTPS_CONNECTION=true`.** The shell forced the value to `false` in `.env` and skipped certificate generation. dotenv never overrides a variable that's already set, so the server still saw `true`, looked for certificates, and exited with "certificate files are missing". Operators went looking for certificates the preset never generates.
- **`config.json` with HTTPS true.** The shell overwrote the value it had just read with `false`, and the server served HTTP. The operator asked for TLS and got HTTP with nothing in the logs saying so.

## Decision

The server **refuses to start** when `NEPTUNE_NOTEBOOK` and `PROXY_SERVER_HTTPS_CONNECTION` are both true. A `superRefine` on `EnvironmentValuesSchema` raises the error at `PROXY_SERVER_HTTPS_CONNECTION`, names both variables, and gives both ways out. It runs during the env parse, before `resolveServerConfig` looks for certificates, so the conflict is the first error the operator sees.

To make the refusal reachable from every route:

- `process-environment.sh` applies the preset's `false` only when the operator didn't ask for `true`. A `true` from `-e` or `config.json` reaches `.env` untouched. Anything else, including values the schema would reject, still becomes `false` as it did before, so the only new failure is the both-true case.
- `docker-entrypoint.sh` skips `setup-ssl.sh` under the preset, so a notebook container without `HOST` reaches the parse instead of exiting in certificate generation.
- The entrypoint starts node with the `NEPTUNE_NOTEBOOK` value from `.env`. The container's own value can differ, since `config.json` replaces it and dotenv won't override it. Passing the `.env` value means the server checks for the conflict exactly when the shell applied the preset.

`NEPTUNE_NOTEBOOK` parses with an exact match on `"true"`, the same test the shell uses, and never fails the parse. The standard image sets it to `""`, and `TRUE` or `1` mean "not the preset" in all three places.

## Considered options

- **Refuse in the env schema (chosen).** One rule, next to every other env rule, and it covers any launch path that reaches the server, not only the entrypoint. It costs the `NEPTUNE_NOTEBOOK` handoff from shell to node.
- **Let the preset win and force HTTP.** This is what the `config.json` route already did. Rejected because it drops an explicit TLS request without telling anyone. An operator who asked for TLS should never end up on HTTP by default.
- **Let HTTPS win and turn the preset off.** Rejected because the notebook proxy expects HTTP on 9250. A notebook container that switches to TLS on 443 fails in a way that's harder to diagnose than a clear refusal.
- **Refuse in `process-environment.sh` only.** About ten lines, and it would drop the handoff. Rejected because the shell would need its own case-insensitive boolean test to match the schema, the rule would live outside Zod, and a launch that skips the entrypoint wouldn't be covered.

## Consequences

- This is a deliberate break on upgrade. A `config.json` with both values true used to serve HTTP and now refuses to start. So does the notebook preset with `-e PROXY_SERVER_HTTPS_CONNECTION=true` and certificates the operator mounted, which probably served TLS before. Both are setups where the operator's two settings contradict each other.
- The refusal reaches the logs through `console.error` from the env parse, not through the pino logger, because the logger is configured from the values being parsed. An alarm that matches pino's `FATAL` level won't fire on it. The exit code is 1, as before.
- The entrypoint reads `NEPTUNE_NOTEBOOK` from the last matching `.env` line, which is what dotenv does, because `process-environment.sh` appends on every start. The `PROXY_SERVER_HTTPS_CONNECTION` read keeps its first-match behaviour on purpose. On restart that read skips `setup-ssl.sh`, so a TLS container keeps its root CA instead of generating a new one. Making the two reads consistent would break trust for anyone who accepted the original certificate.
- Precedence between `-e` and `config.json` in general is out of scope. The scenario table in `config-pipeline.test.ts` pins today's behaviour so a later rule change shows up there.
