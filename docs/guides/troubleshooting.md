[← Guides](./)

# Troubleshooting

This page contains workarounds for common issues and information on how to diagnose other issues.

- [Docker Container Issues](#docker-container-issues)
- [Graph Explorer can't start because it can't write .env](#graph-explorer-cant-start-because-it-cant-write-env)
- [Schema Sync Fails](#schema-sync-fails)
- [Reverse proxy misconfigured](#reverse-proxy-misconfigured)
- [Save & Load Configuration](#save--load-configuration)
- [Graph Explorer Can't Save Your Changes](#graph-explorer-cant-save-your-changes)
- [Gathering SageMaker Logs](#gathering-sagemaker-logs)

## Docker Container Issues

1. If the container does not start, or immediately stops, use `docker logs graph-explorer` to check the container console logs for any related error messages that might provide guidance on why graph-explorer did not start.
2. If you are having issues connecting graph-explorer to your graph database, use your browser's Developer Tools feature to monitor both the browser console and network calls to determine if there are any errors related to connectivity.

### Ports in Use

With HTTPS on, the default, Graph Explorer listens on port 443 only. If port 443 is already in use on the host, use the `-p` flag to publish the container on a different host port. The host port is the first of the two numbers, and you can change it to any free port.

For example, to use port 4431, run the following command:

```
docker run -p 4431:443 \
 --name graph-explorer \
 --env HOST=localhost \
 public.ecr.aws/neptune/graph-explorer
```

Graph Explorer is then at `https://localhost:4431/explorer`.

With HTTPS off, Graph Explorer listens on port 80 instead, so remap that port the same way, such as `-p 8080:80`.

### Serving HTTP behind a reverse proxy

When a reverse proxy in front of Graph Explorer terminates TLS, set [`PROXY_SERVER_HTTPS_CONNECTION`](../references/configuration.md#proxy_server_https_connection) to `false` so Graph Explorer serves plain HTTP to it. When the reverse proxy runs on the same host, publish the port on `127.0.0.1` so only that host can reach it:

```
docker run -p 127.0.0.1:80:80 \
  --name graph-explorer \
  --env PROXY_SERVER_HTTPS_CONNECTION=false \
  public.ecr.aws/neptune/graph-explorer
```

When the reverse proxy runs on another host, limit port `80` to it with network rules you provide. Plain HTTP that other machines can reach isn't supported. See [Serving HTTP Behind a Reverse Proxy](../references/security.md#serving-http-behind-a-reverse-proxy).

### HTTPS Connections

If either Graph Explorer or the proxy server are served over an HTTPS connection (which is the default), your browser will show a security warning due to the self-signed certificate.

See [Trusting the self-signed certificate](../references/security.md#trusting-the-self-signed-certificate) for step-by-step instructions, or [Removing the "Not Secure" warning on Chrome](../references/security.md#removing-the-not-secure-warning-on-chrome) for Chrome-specific instructions.

### Image built on Windows exits with "no such file or directory"

If you build the image from a Windows clone of the repository, the container can exit right away with this message:

```
exec ./docker-entrypoint.sh: no such file or directory
```

The file exists. The error means the shell scripts were checked out with Windows (CRLF) line endings, which Linux can't run. The repository now forces Unix (LF) line endings on shell scripts, but clones made before that change keep their old copies.

To fix it, check the scripts out again from the root of your clone, then rebuild the image:

```
git rm --cached docker-entrypoint.sh process-environment.sh setup-ssl.sh
git checkout HEAD -- docker-entrypoint.sh process-environment.sh setup-ssl.sh
```

A fresh clone also works.

## Graph Explorer can't start because it can't write .env

At startup, the container writes its settings into the configuration folder. If that folder isn't writable, the container exits with this message:

```
Graph Explorer can't start because it can't write ./packages/graph-explorer/.env. The container writes its settings to the configuration folder at startup, so ./packages/graph-explorer must be writable. Check that it isn't mounted read-only.
```

Common causes:

- The configuration folder is mounted read-only
- The container runs as a non-root user (for example `docker run --user`, or on OpenShift)
- The container runs with a read-only root filesystem (for example Kubernetes `readOnlyRootFilesystem: true`)

Running as a non-root user isn't supported yet. See [Support running the container under a non-root UID](https://github.com/aws/graph-explorer/issues/2187) for progress on that.

To fix it:

- Make the configuration folder writable by the container, or
- Point [`CONFIGURATION_FOLDER_PATH`](../references/configuration.md#configuration_folder_path) at a writable location instead

## Schema Sync Fails

This can happen for many reasons. Below are a few of the common ones.

### Timeout

There are multiple sources of timeouts.

- Database server
- Networking layer (load balancer, proxy, etc)
- Browser
- Graph Explorer connection configuration

Graph Explorer distinguishes two kinds of timeout and shows a different message for each.

**Fetch timeout exceeded** means the request didn't finish within the connection's own Fetch Timeout setting. This is a client-side limit you configure yourself in this connection's advanced options, under "Set a fetch timeout". Increase the Fetch Timeout value, or retry the request.

**Database query timed out** means the database itself stopped the query because it ran longer than the database's configured query timeout. For Neptune, this is controlled by the DB cluster parameter group. Increase the query timeout there, or retry the request.

If a request is cancelled instead, Graph Explorer shows a plain "Request cancelled" message rather than either timeout message.

### Out of Memory

This can happen when your database is very large. Graph Explorer does its best to support larger databases and is always improving. Please [file an issue](https://github.com/aws/graph-explorer/issues/new/choose) if you encounter this situation.

### Proxy Server Cannot Be Reached

A "Connection Error" means the browser couldn't reach the Graph Explorer server. The database itself may be fine.

Communication between the client and proxy server can be configured in different ways. When Graph Explorer proxy server starts up it will print out its best approximation of the correct public proxy server address.

This can manifest as different types of errors depending on the root cause. You may receive 404 not found responses or see a "Connection Error".

- The proxy server can be hosting HTTP or HTTPS
- The port of the proxy server could be the default (i.e. 80 or 443 with SSL) or a specific port provided through environment values
- The proxy server paths are not exposed by the networking layer (load balancer, proxy, firewall, etc)
  - The client is hosted at `/explorer`
  - The API paths live at the root rather than under `/explorer`. See [Reference for access control layers](../references/security.md#reference-for-access-control-layers) for the full list.

> [!IMPORTANT]
>
> The API paths could change in a future release. Any change will be noted in the release notes.

### Database Cannot Be Reached

These errors mean the browser reached the proxy server, but the proxy server could not reach the database. Graph Explorer names the failure with one of three titles, and each one points at a different fix.

**Database unreachable** means the database hostname could not be resolved. Check the hostname in the connection's Database URL for a typo, and check that the proxy server's host can resolve that name. A private endpoint, such as a Neptune cluster endpoint inside a VPC, only resolves from inside that VPC.

**Database connection timed out** means the hostname resolved, but nothing answered at that address. The hostname is correct, so look at the network path instead:

- The database's security group must allow inbound traffic on the database port from the proxy server, not from your browser
- A firewall or network ACL between the proxy server and the database can drop the connection
- The port in the connection must match the port the database listens on, for example `8182` for Neptune

This error can take a minute or more to appear, because the proxy server waits for the operating system's connection timeout.

**Connection refused** means the hostname resolved and the host answered, but nothing is listening on that port. Check the port in the connection, and check that the database is running.

For the network setup Neptune needs, see [Network Access](./connecting-to-neptune.md#network-access).

For a proxied connection, the server, not the browser, must have network access to the database. See [System overview](../architecture.md#system-overview) for the network-routing requirements.

### Database Not Reachable From the Browser

"Database not reachable from the browser" appears only for a connection with **Connection method** set to **Directly from your browser**. The browser sends that connection's requests to the database itself, and the request failed before any response arrived. Common causes:

- The database doesn't allow cross-origin requests (CORS) from the Graph Explorer page's origin.
- The database isn't running, or the Database URL has the wrong host or port.
- The browser's network can't reach the database.

To fix it, either configure the database to allow cross-origin requests from the Graph Explorer page, or edit the connection and set **Connection method** to **Through the Graph Explorer server** so the Graph Explorer server connects to the database instead.

### Insecure Database URL

"Insecure database URL" appears only for a connection with **Connection method** set to **Directly from your browser**, when the Graph Explorer page is served over HTTPS, the Database URL starts with `http://`, and the request failed. Browsers block requests from an HTTPS page to an HTTP address as mixed content, so the browser most likely blocked this one. A loopback Database URL is exempt, because browsers allow it over HTTP: `localhost`, any `.localhost` subdomain, any `127.x.x.x` address, or `[::1]`.

To fix it, either use an `https://` Database URL, or edit the connection and set **Connection method** to **Through the Graph Explorer server** so the Graph Explorer server connects to the database instead.

If your browser allows insecure content for this site, the request wasn't blocked and failed for another reason. Check that the database is running at the Database URL and allows cross-origin requests (CORS) from the Graph Explorer page, as described in [Database Not Reachable From the Browser](#database-not-reachable-from-the-browser).

### Requests Refused by Neptune

A **403 Forbidden** error on a Neptune connection means Neptune received the request and refused it. The message under the error comes from Neptune and usually names the reason. Common causes:

- The cluster has IAM database authentication enabled, but the connection has **Use AWS IAM authentication** turned off.
- The connection's **AWS Region** or **Service Type** doesn't match the database, so the signature doesn't match.
- The proxy server's AWS identity, such as the ECS task role or the EC2 instance profile's role, has no Neptune data-access policy.
- The policy's `Resource` doesn't name this database. Check the region, the account ID, and the resource ID, and check that no placeholder or square bracket is left. For Neptune Database, the resource ID is the cluster resource ID starting with `cluster-`, not the cluster identifier.
- The query changes data, but the policy is read-only.

When the proxy server can't find AWS credentials at all, the request fails before it reaches Neptune, and the proxy server log says credentials couldn't be loaded. On EC2, check the instance profile and the metadata hop limit described in the [EC2 prerequisites](./deploy-to-ec2.md#prerequisites).

For policies to start from, see [Sample IAM Policies](./iam-policies/README.md).

### IAM authentication needs an https:// Database URL

A **Bad Request** error with the message "IAM authentication needs an `https://` Database URL" means the connection has **Use AWS IAM authentication** turned on, but its Database URL starts with `http://`. Neptune accepts only HTTPS, so the proxy server refuses to sign the request and doesn't send it. To fix it, either:

- Edit the connection and change the Database URL to `https://`
- Edit the connection and turn off **Use AWS IAM authentication**, if the database doesn't use IAM authentication

For the Default Connection, change `GRAPH_CONNECTION_URL` to an `https://` URL, or set `IAM` to `false`. For more on signing, see [Permissions](../references/security.md#permissions).

## Reverse proxy misconfigured

This error appears as soon as the app first calls the Graph Explorer server: on page load when there are no saved connections, otherwise on the first schema sync or query. The client resolves the API root from its own path as soon as it needs it.

Graph Explorer works behind a reverse proxy at any prefix depth, and the prefix can even contain the word "explorer" without conflict, as long as the proxy strips the prefix and forwards the rest of the path unchanged, including the client's own `/explorer` segment. For example, an nginx rule mapping `/gx/` onto the server looks like:

```
location /gx/ { proxy_pass http://server:9250/; }
```

That rule forwards the whole `/gx/` prefix, so `/gx/explorer/` reaches the client at `/explorer/` and the API calls at `/gx/sparql`, `/gx/gremlin`, `/gx/summary`, `/gx/logger`, and `/gx/defaultConnection` reach `/sparql`, `/gremlin`, `/summary`, `/logger`, and `/defaultConnection`. A rule scoped to `/gx/explorer/` alone would serve the page but match none of the API paths, so every query would fail.

A proxy that renames the `/explorer` segment away instead, for example mapping an external `/gx/` directly onto the server's `/explorer/`, is not supported. The page will still render, since assets resolve with a relative base path, but the browser has no way to tell where the API root is, and Graph Explorer now fails with a clear "Reverse proxy misconfigured" error rather than sending requests to the wrong place.

## Save & Load Configuration

Inside of Graph Explorer there is an option to save all the configuration data that Graph Explorer uses. This data is local to the user's browser and does not exist on the server.

To save the configuration data:

1. Launch Graph Explorer
2. Navigate to the connections screen
3. Press the "Settings" button in the navigation bar
4. Select the "General" page within settings
5. Press the "Save Configuration" button
6. Choose where to save the configuration file

This configuration can be restored using the "Load Configuration" button in the same settings page.

## Graph Explorer Can't Save Your Changes

Graph Explorer stores all of your data — connections, schema, styling, and exploration sessions — in your browser, not on the server. When it can't write that data to browser storage, a "Changes not saved" indicator appears in the navigation bar. Click it to see which data failed to save and why.

There are two common causes:

- **Browser storage is full.** Graph Explorer has run out of space to save changes. The dialog offers a "Save Configuration" button — use it to export your data to a file (the same format as [Save & Load Configuration](#save--load-configuration)) so you don't lose your work, then free up browser storage and reload the page. You can restore the file afterward with "Load Configuration". Exploration sessions are the largest data and the most likely cause; clearing old sessions or other sites' storage frees space.
- **Storage is blocked or inaccessible.** Graph Explorer can't access browser storage at all, so changes won't be saved for the session. No backup is offered here, since the data can't be read out. This commonly happens in private/incognito windows or when browser settings or policy block storage for the site. Open Graph Explorer in a normal window, or allow storage for the site, to persist your work.

Transient storage hiccups are retried automatically, so the indicator only appears for failures that could not be recovered.

## Gathering SageMaker Logs

The Graph Explorer proxy server outputs log statements to standard out. By default, these logs will be forwarded to CloudWatch if the Notebook has the proper permissions.

To gather these logs:

1. Open the AWS Console
2. Navigate to the Neptune page
3. Select "Notebook" from the sidebar
4. Find the Notebook hosting Graph Explorer
5. Open the details screen for that Notebook
6. In the "Actions" menu, choose "View Details in SageMaker"
7. Press the "View Logs" link in the SageMaker details screen under the field titled "Lifecycle configuration"
8. Scroll down to the "Log Streams" panel in the CloudWatch details where you should find multiple log streams
9. For each log stream related to Graph Explorer (LifecycleConfigOnStart.log, graph-explorer.log)
   1. Open the log stream
   2. In the "Actions" menu, choose "Download search results (CSV)"

### Graph Explorer Log Stream Does Not Exist

New Neptune Notebooks automatically apply the correct IAM permissions to write to CloudWatch. If your Notebook does not automatically create a graph-explorer.log in the CloudWatch Log Streams, then it is possible that the Neptune Notebook was created before those IAM permissions were added. You'll need to add those permissions manually.

Below are examples of which IAM permissions you need for Graph Explorer.

- [IAM permissions for Neptune DB](./deploy-to-sagemaker/graph-explorer-neptune-db-policy.json)
- [IAM permissions for Neptune Analytics](./deploy-to-sagemaker/graph-explorer-neptune-analytics-policy.json)
