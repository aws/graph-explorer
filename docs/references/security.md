[← References](./)

# Security

The browser talks to the same-origin proxy server, and the proxy server is what reaches the graph database. That means the proxy server must have network access to the target database, as described in the [architecture overview](../architecture.md#system-overview). The one exception is a deprecated direct connection, where the browser sends requests to the database itself.

Graph Explorer supports the HTTPS protocol by default and provides a self-signed certificate as part of the Docker image. You can choose to use HTTP instead by changing the [environment variable default settings](./configuration.md#application-configuration).

## Access Control

Graph Explorer performs no authentication and no authorization. The proxy server never checks who the caller is.

Anyone who can reach Graph Explorer can read and modify any data in the connected graph database, using whatever credentials the deployment holds. Never expose Graph Explorer publicly without an access control layer in front of it.

You own who can reach the deployment and what authenticates in front of it. Graph Explorer owns behaving correctly once a request arrives.

Access control for this application can live in one of two places. You can control who can reach the proxy server at all, through network placement and firewall or security group rules. You can also put something in front of it that authenticates callers.

Of the four documented deployment paths, one runs on a platform that already provides an authentication layer.

| Deployment | Platform provides an authentication layer |
| --- | --- |
| [Docker](../guides/deploy-with-docker.md) | No |
| [Amazon EC2](../guides/deploy-to-ec2.md) | No |
| [ECS Fargate](../guides/deploy-to-ecs-fargate.md) | No |
| [Amazon SageMaker](../guides/deploy-to-sagemaker.md) | Yes |

SageMaker is the exception because the notebook's Jupyter proxy requires a signed-in AWS principal, and it reaches the Graph Explorer container over loopback.

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

**Timeouts.** Schema sync against a large graph can run for minutes. The client request timeout, [`GRAPH_EXP_FETCH_REQUEST_TIMEOUT`](./configuration.md#environment-variables), defaults to 240000 ms. A layer with a shorter read timeout ends those requests first.

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

If `NEPTUNE_NOTEBOOK` is also set to `true`, the server exits earlier, during environment parsing, with an error naming the conflict between `NEPTUNE_NOTEBOOK` and `PROXY_SERVER_HTTPS_CONNECTION`, since the notebook preset never generates certificates.

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

### Disabling HTTPS

To serve over HTTP instead, set `PROXY_SERVER_HTTPS_CONNECTION=false` in your environment or `.env` file.

> [!WARNING]
>
> Do not disable HTTPS unless something in front of Graph Explorer terminates TLS. Over HTTP, database connection URLs and query text travel in plain text between the browser and the proxy server.

### Trusting the self-signed certificate

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

By default, the proxy server does not allow cross-origin requests. The browser reaches the proxy server's API from the same origin it served the UI from, so CORS is not needed for the UI itself. A deprecated direct connection is different: the browser calls the database from the Graph Explorer page's origin, so the database must allow cross-origin requests from it. In development mode, the Vite dev server proxies API requests to the Express server to maintain same-origin behavior.

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

By default, the proxy server forwards requests to any database URL specified by the client. You can restrict which database origins the proxy will contact by setting [`PROXY_SERVER_ALLOWED_DB_ORIGINS`](./configuration.md#proxy_server_allowed_db_origins). Requests targeting an unlisted origin receive a 403 response.

Leaving the allowlist unset matters more on a host with AWS credentials, such as an EC2 instance profile or ECS task role. The proxy server signs any request that carries the `aws-neptune-region` header, whatever the `IAM` setting, so an unset allowlist lets a client get requests signed for any origin it names. Set `PROXY_SERVER_ALLOWED_DB_ORIGINS` in any deployment where the host has AWS credentials.

> [!NOTE]
>
> This check applies only to requests routed through the proxy server. It doesn't apply to deprecated direct connections, because the browser sends their requests to the database itself.

## HTTP Redirects

The proxy server does not follow HTTP redirects from the database. If the database responds with a redirect (3xx status), the proxy returns an error to the client instead of following it. This prevents a compromised or misconfigured database endpoint from redirecting the proxy to an unrelated internal service.

## Permissions

Graph Explorer enforces no permissions. It sends every query to the database as written, including queries that modify data. Permissions belong to whoever runs the deployment, at two separate layers:

- **Who may use Graph Explorer** is controlled by the [access control](#access-control) layer in front of it.
- **What the database allows** is configured in the database by its provider or administrator.

Neither layer substitutes for the other. A read-only database policy does not stop an unauthenticated visitor from reading the graph. An access control layer does not stop a signed-in user from running mutations.

Amazon Neptune IAM database authentication is one way to control the database layer. The proxy server signs a request when it carries the `aws-neptune-region` header, using the AWS credentials of the proxy server's host, such as an EC2 instance profile or ECS task role. That role is the identity Neptune checks, and every user of the deployment shares it. A request without the header goes out unsigned, and the policy does not apply to it.

For the minimum Neptune permissions Graph Explorer needs, see [Minimum Database Permissions](../guides/deploy-to-sagemaker.md#minimum-database-permissions).

> [!CAUTION]
>
> By default, a Neptune Notebook will have full read & write access to Neptune data.
