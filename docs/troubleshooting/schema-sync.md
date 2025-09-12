# Schema Sync Issues

This guide covers common issues when performing schema synchronization in Graph
Explorer.

## Common Schema Sync Failures

Schema sync can fail for many reasons. Below are a few of the common ones.

## Mismatched Proxy Server URL

When running a schema sync, a common cause of failures is a mismatch between the
proxy server URL in your connection settings and the URL currently loaded in
your browser. This mismatch can trigger a "Connection Error" message in Graph
Explorer.

Modern browsers enforce a security policy called
[Same-Origin Policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy),
which requires API requests to be sent to the same domain as the page you're
viewing. If your connection settings specify a different domain than your
current browser URL, the request will be blocked.

To resolve this issue:

1. Check your connection settings
2. Ensure the proxy server URL matches the domain portion of your current
   browser URL
3. Update the connection if necessary

For example:

```
# if the current browser page URL is
https://graph-explorer.mydomain.com/explorer/#/connections

# the connection setting's proxy server URL should be
https://graph-explorer.mydomain.com
```

## Timeout

There are multiple sources of timeouts.

- Database server
- Networking layer (load balancer, proxy, etc)
- Browser
- Graph Explorer connection configuration

The error you receive in Graph Explorer can interpret Neptune timeout errors and
timeouts from Graph Explorer's configuration.

## Out of Memory

This can happen when your database is very large. Graph Explorer does its best
to support larger databases and is always improving. Please
[file an issue](https://github.com/aws/graph-explorer/issues/new/choose) if you
encounter this situation.

## Proxy Server Cannot Be Reached

Communication between the client and proxy server can be configured in different
ways. When Graph Explorer proxy server starts up it will print out its best
approximation of the correct public proxy server address.

This can manifest as different types of errors depending on the root cause. You
may receive 404 not found responses or get connection refused errors.

- The proxy server can be hosting HTTP or HTTPS
- The port of the proxy server could be the default (i.e. 80 or 443 with SSL) or
  a specific port provided through environment values
- The proxy server paths are not exposed by the networking layer (load balancer,
  proxy, firewall, etc)
  - The client is hosted at `/explorer` by default, which is configurable
  - Queries are handled via `/gremlin`, `/opencypher`, `/sparql`
  - Summary APIs are handled via `/summary`, `/pg/statistics/summary`,
    `/rdf/statistics/summary`
  - Logging is handled by `/logger`
  - Default connection is handled by `/defaultConnection`

> [!IMPORTANT]  
> The paths listed here could always change in the future. If they do change, we
> will note that in the release notes.
