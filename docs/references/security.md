[← References](./)

# Security

The browser talks to the same-origin proxy server, and the proxy server is what reaches the graph database. That means the proxy server must have network access to the target database, as described in the [architecture overview](../architecture.md#system-overview). The one exception is a direct connection, where the browser sends requests to the database itself.

The Docker image serves HTTPS by default. It generates a self-signed certificate at startup when `HOST` is set, or uses certificates you provide, as described in [HTTPS Connections](#https-connections). [Supported Hosting](#supported-hosting) lists the setups Graph Explorer supports.

## Supported Hosting

A supported deployment of Graph Explorer has both of these:

- **HTTPS.** Graph Explorer serves it with its own certificate, as described in [HTTPS Connections](#https-connections), or a reverse proxy in front of Graph Explorer terminates TLS.
- **Access control you provide.** Authentication in front of Graph Explorer, or network rules that limit who can reach it. See [Access Control](#access-control).

Graph Explorer can serve plain HTTP in two cases:

- **Behind a reverse proxy that terminates TLS**, when only the reverse proxy can reach Graph Explorer. See [Serving HTTP Behind a Reverse Proxy](#serving-http-behind-a-reverse-proxy).
- **To try Graph Explorer on your own machine**, when no other machine can reach it, such as with its port published on `127.0.0.1`.

Plain HTTP that other machines can reach isn't supported, because database connection URLs, query text, and query results cross the network unencrypted.

## Access Control

Graph Explorer performs no authentication and no authorization. The proxy server never checks who the caller is.

Anyone who can reach Graph Explorer can read and modify any data in the connected graph database, using whatever credentials the deployment holds. Never expose Graph Explorer publicly without an access control layer in front of it.

You own who can reach the deployment and what authenticates in front of it. Graph Explorer owns behaving correctly once a request arrives.

Access control for this application can live in one of two places. You can control who can reach the proxy server at all, through network placement and network rules you provide. Confirm your rules apply to the port you publish, because container platforms can publish ports in a way host firewalls don't filter. You can also put something in front of it that authenticates callers.

Of the four documented deployment paths, one runs on a platform that already provides an authentication layer.

| Deployment | Platform provides an authentication layer |
| --- | --- |
| [Docker](../guides/deploy-with-docker.md) | No |
| [Amazon EC2](../guides/deploy-to-ec2.md) | No |
| [ECS Fargate](../guides/deploy-to-ecs-fargate.md) | No |
| [Amazon SageMaker](../guides/deploy-to-sagemaker.md) | Yes |

SageMaker is the exception because the notebook's Jupyter proxy requires a signed-in AWS principal, and it reaches the Graph Explorer container over loopback.

### Self-hosted Gremlin Server

In Apache TinkerPop 3.x, Gremlin Server uses the `gremlin-groovy` script engine by default. It can run arbitrary code on the server, not only Gremlin traversals. TinkerPop treats this as intended and leaves restricting it to the server operator. Other databases built on Gremlin Server may also enable Groovy by default.

When Graph Explorer connects to a server with Groovy enabled:

- Restrict access to Graph Explorer as strictly as access to the Gremlin Server host.
- Keep Graph Explorer on an isolated network behind an authenticating layer, and never make it publicly reachable.
- Let only Graph Explorer's proxy server reach Gremlin Server, with network rules you provide. A [direct connection](../features/connections.md#add-a-new-connection) needs each user's browser to reach Gremlin Server instead, which also lets every other site open in that browser reach it, even when the server listens only on `localhost`. Prefer a proxy connection, and choose a direct connection only for a server where you accept that risk.

For server-side options, read [Security](https://tinkerpop.apache.org/docs/current/reference/#security) and [Protecting Script Execution](https://tinkerpop.apache.org/docs/current/reference/#script-execution) in the TinkerPop reference documentation. Amazon Neptune doesn't use the Groovy script engine.

### Reference for access control layers

How Graph Explorer behaves on the wire, for anyone adding an access control layer in front of it.

**Request headers.** The proxy server reads `graph-db-connection-url`, `aws-neptune-region`, `service-type`, `db-query-logging-enabled`, and `queryid`. `POST /logger` also reads `level` and `message`. Without `graph-db-connection-url`, every query fails with a 400 whose body names the missing header. The proxy server never reads a client `Authorization` header or cookie, and never forwards either one to the database.

**Paths.** The UI lives under `/explorer`. It calls the API on its own origin, under the same prefix it was loaded from, with the `/explorer` segment cut out. A layer that renames that segment breaks the UI, see [Reverse proxy misconfigured](../guides/troubleshooting.md#reverse-proxy-misconfigured). The API paths sit next to `/explorer`, not under it, so a layer that forwards only `/explorer/*` serves a UI that loads and then fails every query.

| Path                      | Method |
| ------------------------- | ------ |
| `/defaultConnection`      | GET    |
| `/sparql`                 | POST   |
| `/gremlin`                | POST   |
| `/openCypher`             | POST   |
| `/summary`                | GET    |
| `/pg/statistics/summary`  | GET    |
| `/rdf/statistics/summary` | GET    |
| `/logger`                 | POST   |
| `/status`                 | GET    |

**Path matching.** The proxy server matches paths case-insensitively, so `/gremlin` and `/GREMLIN` reach the same handler. A path rule in a layer that matches case-sensitively covers only the casing it names. The `/explorer` segment is the exception. The UI finds it in its own URL with a case-sensitive match, so a layer that changes its casing breaks the UI the same way renaming it does.

**Health check.** `GET /status` is the [health check](./health-check.md) endpoint. It returns a fixed string and does not contact the database. `GET /defaultConnection` returns the default connection configuration, including the database endpoint, region, service type, and whether IAM signing is enabled.

**Timeouts.** Schema sync against a large graph can run for minutes. A connection has no fetch timeout unless **Set a fetch timeout** is checked in its **Advanced options**. The Default Connection uses a fetch timeout of 240000 ms. A layer with a shorter read timeout ends those requests first.

**Request bodies.** The proxy server accepts request bodies up to 50 MB.

**Protocols.** All traffic is plain HTTP request and response. Graph Explorer uses no WebSocket or SSE connections.

**Origins.** The UI calls the API on the origin it was served from. [`PROXY_SERVER_CORS_ORIGIN`](./configuration.md#proxy_server_cors_origin) only matters for a different web application calling the API from its own origin, see [CORS](#cors).

## HTTPS Connections

Graph Explorer serves over HTTPS by default using a self-signed certificate. The `HOST` environment variable controls the hostname used in the certificate's Subject Alternative Name (SAN). When `HOST` is set, the entrypoint script generates a fresh self-signed certificate on container startup. When `HOST` is not set, the server expects to find existing certificate files.

### Certificate files

The proxy server reads certificates from the following location inside the container:

```
/graph-explorer/packages/graph-explorer-proxy-server/cert-info/
├── rootCA.key    # Root CA private key
├── rootCA.crt    # Root CA certificate
├── server.key    # Server private key
├── server.csr    # Server certificate signing request
├── server.crt    # Server certificate
├── csr.conf      # CSR configuration template
└── cert.conf     # Certificate extensions configuration
```

If HTTPS is enabled and any of these files are missing, the server will exit with an error listing the missing files.

### Keeping the certificate across container replacements

When `HOST` is set, every new container generates its own self-signed certificate. Replacing the container, for example on an image upgrade, invalidates the certificate you trusted by hand. Restarting the same container keeps its certificate.

To keep one certificate across replacements, mount `cert-info` as a named volume and set `HOST` only on the first run:

```bash
# First run generates the certificate into the volume
docker run -p 443:443 \
  --env HOST=localhost \
  -v graph-explorer-certs:/graph-explorer/packages/graph-explorer-proxy-server/cert-info \
  public.ecr.aws/neptune/graph-explorer

# Later containers reuse it because HOST is unset
docker run -p 443:443 \
  -v graph-explorer-certs:/graph-explorer/packages/graph-explorer-proxy-server/cert-info \
  public.ecr.aws/neptune/graph-explorer
```

The certificate is valid for the `HOST` value and dates from the first run. Delete the volume to generate a new one.

### Using your own certificates

To use your own certificates instead of the self-signed ones, mount your certificate files into the `cert-info` directory. All five certificate files must be present (`rootCA.key`, `rootCA.crt`, `server.key`, `server.csr`, `server.crt`).

> [!IMPORTANT]
>
> Do not set the `HOST` environment variable, otherwise the entrypoint will overwrite your files with a new self-signed certificate.

```bash
docker run -p 443:443 \
  -v /path/to/your/server.key:/graph-explorer/packages/graph-explorer-proxy-server/cert-info/server.key \
  -v /path/to/your/server.crt:/graph-explorer/packages/graph-explorer-proxy-server/cert-info/server.crt \
  -v /path/to/your/rootCA.crt:/graph-explorer/packages/graph-explorer-proxy-server/cert-info/rootCA.crt \
  -v /path/to/your/rootCA.key:/graph-explorer/packages/graph-explorer-proxy-server/cert-info/rootCA.key \
  -v /path/to/your/server.csr:/graph-explorer/packages/graph-explorer-proxy-server/cert-info/server.csr \
  public.ecr.aws/neptune/graph-explorer
```

<a id="disabling-https"></a>

### Serving HTTP Behind a Reverse Proxy

When a reverse proxy in front of Graph Explorer terminates TLS, Graph Explorer can serve plain HTTP to it. Set `PROXY_SERVER_HTTPS_CONNECTION=false` in your environment or `.env` file. The proxy server then listens on [`PROXY_SERVER_HTTP_PORT`](./configuration.md#proxy_server_http_port), port `80` by default, on every network interface.

Let only the reverse proxy reach that port:

- When the reverse proxy runs on the same host, publish the port on the loopback interface, such as `-p 127.0.0.1:80:80`.
- When it runs on another host, limit the port to the reverse proxy with network rules you provide.

Confirm your rules apply to the port you publish. Container platforms can publish ports in a way host firewalls don't filter.

> [!WARNING]
>
> Over HTTP, database connection URLs, query text, and query results travel in plain text between the reverse proxy and the proxy server. A client that reaches the port directly also skips any authentication the reverse proxy applies.

To try Graph Explorer on your own machine without a reverse proxy, publish the port on `127.0.0.1` so no other machine can reach it. See [Supported Hosting](#supported-hosting).

### Trusting the self-signed certificate

Trusting the certificate by hand suits a deployment only you use. Every user would have to repeat these steps on their own machine, and a user who clicks through the browser warning can't confirm they reached your server. For a deployment other people use, serve a certificate their browsers already trust, either [your own certificate](#using-your-own-certificates) or one on a reverse proxy that terminates TLS.

When using the default self-signed certificate, your browser will show a security warning. You can bypass this by trusting the certificate:

1. Download the certificate directly from the browser. For example, if using Google Chrome, click the "Not Secure" section on the left of the URL bar and select "Certificate is not valid" to show the certificate. Then click Details tab and click Export at the bottom.
2. Once you have the certificate, you will need to trust it on your machine. For MacOS, you can open the Keychain Access app. Select System under System Keychains. Then go to File > Import Items... and import the certificate you downloaded in the previous step.
3. Once imported, select the certificate and right-click to select "Get Info". Expand the Trust section, and change the value of "When using this certificate" to "Always Trust".
4. You should now refresh the browser and see that you can proceed to open the application. For Chrome, the application will remain "Not Secure" due to the fact that this is a self-signed certificate. If you have trouble accessing Graph Explorer after completing the previous step and reloading the browser, consider running a docker restart command and refreshing the browser again.

### Removing the "Not Secure" warning on Chrome

For browsers like Safari and Firefox, trusting the certificate from the browser (steps above) is enough to bypass the "Not Secure" warning. However, Chrome treats self-signed certificates differently. To remove the warning on Chrome, you need to trust the **root CA certificate** rather than the server certificate. See the [Chrome Root Store FAQ](https://chromium.googlesource.com/chromium/src/+/main/net/data/ssl/chrome_root_store/faq.md#how-does-the-chrome-certificate-verifier-integrate-with-platform-trust-stores-for-local-trust-decisions) for details on how Chrome integrates with platform trust stores.

1. Copy the root certificate from the running container to your local machine:
   ```
   docker cp graph-explorer:/graph-explorer/packages/graph-explorer-proxy-server/cert-info/rootCA.crt ./rootCA.crt
   ```
   If Graph Explorer is running on a remote host (e.g., EC2), copy the file to the remote host first, then use `scp` to transfer it to your local machine.
2. Trust the root certificate on your machine. For macOS, open the Keychain Access app, select System under System Keychains, then go to File > Import Items... and import `rootCA.crt`.
3. Once imported, select the certificate and right-click to select "Get Info". Expand the Trust section, and change the value of "When using this certificate" to "Always Trust".
4. Refresh the browser. The "Not Secure" warning should be gone.

## CORS

By default, the proxy server does not allow cross-origin requests. The browser reaches the proxy server's API from the same origin it served the UI from, so CORS is not needed for the UI itself. A direct connection is different: the browser calls the database from the Graph Explorer page's origin, so the database must allow cross-origin requests from it. In development mode, the Vite dev server proxies API requests to the Express server to maintain same-origin behavior.

`PROXY_SERVER_CORS_ORIGIN` is for a different case: some other web application, running at its own origin, calling the proxy server's API directly (not through the Graph Explorer UI). Set it to the origin you want to allow.

```bash
PROXY_SERVER_CORS_ORIGIN=https://my-app.example.com
```

To allow multiple origins, separate them with commas:

```bash
PROXY_SERVER_CORS_ORIGIN=https://my-app.example.com,https://other-app.example.com
```

> [!NOTE]
>
> CORS headers only affect browser-initiated requests — direct API calls from scripts or other servers are not restricted by CORS. CORS is a defense-in-depth layer, not a substitute for authentication or network-level access controls. Ensure the proxy server is not exposed to untrusted networks.

## Database Origin Allowlist

By default, the proxy server forwards requests to any database URL specified by the client, except [link-local addresses](#link-local-addresses). You can restrict which database origins the proxy will contact by setting [`PROXY_SERVER_ALLOWED_DB_ORIGINS`](./configuration.md#proxy_server_allowed_db_origins). Requests targeting an unlisted origin receive a 403 response.

Leaving the allowlist unset matters more on a host with AWS credentials, such as an EC2 instance profile or ECS task role. Any user can turn on IAM authentication in their own Connection, whatever the server's `IAM` setting, and the proxy server then signs the request with the host's credentials, as described in [Permissions](#permissions). Without an allowlist it signs for any origin a user names, so users can reach every database that identity's policy allows, in any region. Set `PROXY_SERVER_ALLOWED_DB_ORIGINS` in any deployment where the host has AWS credentials.

The first time the proxy server signs a request with no allowlist set, it logs a warning naming the origin and `PROXY_SERVER_ALLOWED_DB_ORIGINS`. It logs this once per process and never for unsigned requests.

> [!NOTE]
>
> This check applies only to requests routed through the proxy server. It doesn't apply to direct connections, because the browser sends their requests to the database itself.

## Link-Local Addresses

The proxy server refuses any database URL whose host is a link-local IP address, in `169.254.0.0/16` or `fe80::/10`, and returns a 403 response. Link-local addresses are never graph databases. The refusal applies whether or not the [Database Origin Allowlist](#database-origin-allowlist) is set, and an allowlist entry can't override it.

This refusal doesn't replace the allowlist. To limit the proxy server to your databases, set [`PROXY_SERVER_ALLOWED_DB_ORIGINS`](./configuration.md#proxy_server_allowed_db_origins).

## HTTP Redirects

The proxy server does not follow HTTP redirects from the database. If the database responds with a redirect (3xx status), the proxy returns an error to the client instead of following it. This prevents a compromised or misconfigured database endpoint from redirecting the proxy to an unrelated internal service.

## Permissions

Graph Explorer enforces no permissions. It sends every query to the database as written, including queries that modify data. Permissions belong to whoever runs the deployment, at two separate layers:

- **Who may use Graph Explorer** is controlled by the [access control](#access-control) layer in front of it.
- **What the database allows** is configured in the database by its provider or administrator.

Neither layer substitutes for the other. A read-only database policy does not stop an unauthenticated visitor from reading the graph. An access control layer does not stop a signed-in user from running mutations.

Amazon Neptune IAM database authentication is one way to control the database layer. The proxy server signs a request when it carries the `aws-neptune-region` header, using the AWS credentials of the proxy server's host, such as an EC2 instance profile or ECS task role. That role is the identity Neptune checks, and every user of the deployment shares it. A request without the header goes out unsigned, and the policy does not apply to it.

The proxy server signs a request only when its Database URL starts with `https://`, because Neptune accepts only HTTPS connections, as described in [Encrypting connections to your Amazon Neptune database with SSL/HTTPS](https://docs.aws.amazon.com/neptune/latest/userguide/security-ssl.html). A request with the `aws-neptune-region` header and an `http://` Database URL gets a 400 response, and the proxy server neither signs nor sends it. To fix it, change the Database URL to `https://`, or turn off IAM authentication for that Connection. Requests without the header aren't affected, so a database served over `http://`, such as Gremlin Server, still works without IAM authentication.

Because the identity is shared, any user can reach any database its policy allows, not only the one the deployment was set up for. Two controls limit that, and you can use either or both:

- **The identity's database policy** decides which databases and actions a signed request may use. Scope its `Resource` to the databases you intend, and its actions to the ones Graph Explorer uses: read, write, and delete data via query, cancel query, and get graph summary. Leave out write and delete to make the deployment read-only, at the cost of mutations in the query editor. [Sample IAM Policies](../guides/iam-policies/README.md) has read-only and read-write examples.
- **The [Database Origin Allowlist](#database-origin-allowlist)** decides which database origins the proxy server contacts at all, for signed and unsigned requests alike.

The policy is the stronger control, because Neptune enforces it no matter what sends the request. The allowlist adds a second boundary in the proxy server, and covers databases that don't use IAM authentication. The proxy server also [doesn't follow redirects](#http-redirects), so a database response can't send it on to another destination.

Graph Explorer doesn't limit which databases it signs for by default. Many deployments serve one person who chooses their own databases, and refusing would break them for a risk the identity's policy already controls. Whoever runs a shared deployment decides how far to limit it.

For the minimum Neptune permissions Graph Explorer needs, see [Sample IAM Policies](../guides/iam-policies/README.md#choose-a-policy). For SageMaker notebooks, see [Minimum Database Permissions](../guides/deploy-to-sagemaker.md#minimum-database-permissions).

> [!CAUTION]
>
> By default, a Neptune Notebook will have full read & write access to Neptune data.
