# ADR: Document a supported hosting model instead of enforcing one

- **Status:** Accepted
- **Date:** 2026-10-22
- **Related:** #2459. Affects `docs/references/security.md`, the deployment, troubleshooting, and development docs, and `REVIEW.md`.

## Context

Graph Explorer has no authentication. Whoever reaches the proxy server can run any query with the credentials the deployment holds. The proxy server serves HTTPS or plain HTTP, set by `PROXY_SERVER_HTTPS_CONNECTION`, and listens on every network interface.

The docs never said which setups were supported. The security reference said you could switch to HTTP by changing the defaults. The troubleshooting guide offered HTTP as a preference, with a `docker run` that published port 80 on every interface. Over plain HTTP, database connection URLs, query text, and query results cross the network unencrypted.

Some deployments do need plain HTTP. A SageMaker notebook serves HTTP over loopback to Jupyter, which terminates TLS. A container behind a load balancer that terminates TLS has the same shape. Trying Graph Explorer on your own machine needs neither a certificate nor access control.

## Decision

The security reference states one supported hosting model, in a new "Supported Hosting" section, and every other page agrees with it:

- HTTPS, served by Graph Explorer with its own certificate or by a reverse proxy that terminates TLS.
- Access control the operator provides: authentication, or network rules that limit who can reach it.
- Plain HTTP only behind a reverse proxy that terminates TLS, or to try Graph Explorer on your own machine.
- Plain HTTP that other machines can reach isn't supported.

The model lives in the docs. The server's behavior doesn't change. `REVIEW.md` makes a doc or sample example outside the model an Important finding, so new pages keep to it.

"Disabling HTTPS" becomes "Serving HTTP Behind a Reverse Proxy".

## Considered options

- **Document the model (chosen).** No deployment breaks, and every page gives the same answer.
- **Refuse plain HTTP unless the server listens on loopback.** Rejected. Inside a container the server must listen on every interface for a published port to work, and a reverse proxy on another host has to reach it. The server can't tell whether a reverse proxy in front of it terminates TLS.
- **Add a setting that confirms a TLS-terminating reverse proxy, and refuse HTTP without it.** Rejected for now. Every HTTP deployment would need the new setting to keep starting, and setting it proves nothing about what is in front of the server.
- **Keep HTTP as an option with a warning.** This was the state before. Rejected because a documented option reads as a supported one.

## Consequences

- A deployment that serves plain HTTP to other machines keeps working, but is outside the supported model. The release's upgrade note says so.
- Examples serve HTTPS, or publish plain HTTP on `127.0.0.1`. The HTTPS examples no longer publish port 80, which nothing listens on while HTTPS is on.
- `pnpm dev` and `pnpm start` still serve HTTP on every interface. The development guide says so and asks the reader to keep them to their own machine.
- The deployment guides can point at "Supported Hosting" as the one statement of the model.
