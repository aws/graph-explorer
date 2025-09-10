# Troubleshooting

This page contains workarounds for common issues and information on how to
diagnose other issues.

- [Docker Container Issues](#docker-container-issues)
- [Schema Sync Fails](#schema-sync-fails)
- [Backup Graph Explorer Data](#backup-graph-explorer-data)
- [Gathering SageMaker Logs](#gathering-sagemaker-logs)

## Docker Container Issues

1. If the container does not start, or immediately stops, use
   `docker logs graph-explorer` to check the container console logs for any
   related error messages that might provide guidance on why graph-explorer did
   not start.
2. If you are having issues connecting graph-explorer to your graph database,
   use your browser's Developer Tools feature to monitor both the browser
   console and network calls to determine if here are any errors related to
   connectivity.

### Ports in Use

If the default ports of 80 and 443 are already in use, you can use the `-p` flag
to change the ports to something else. The host machine ports are the first of
the two numbers. You can change those to whatever you want.

For example, if you want to use port 8080 and 4431, you can use the following
command:

```
docker run -p 8080:80 -p 4431:443 \
 --name graph-explorer \
 --env HOST=localhost \
 public.ecr.aws/neptune/graph-explorer
```

Which will result in the following URLs:

- HTTPS: `https://localhost:4431/explorer`
- HTTP: `http://localhost:8080/explorer`

### HTTP Only

If you do not want to use SSL and HTTPS, you can disable it by setting the
following [environment variables](/additionaldocs/deployment/configuration.md):

```
PROXY_SERVER_HTTPS_CONNECTION=false
GRAPH_EXP_HTTPS_CONNECTION=false
```

These can be passed when creating the Docker container like so:

```
docker run -p 80:80 \
  --name graph-explorer \
  --env PROXY_SERVER_HTTPS_CONNECTION=false \
  --env GRAPH_EXP_HTTPS_CONNECTION=false \
  public.ecr.aws/neptune/graph-explorer
```

### HTTPS Connections

If either of the Graph Explorer or the proxy-server are served over an HTTPS
connection (which it is by default), you will have to bypass the warning message
from the browser due to the included certificate being a self-signed
certificate.

You can bypass by manually ignoring them from the browser or downloading the
correct certificate and configuring them to be trusted. Alternatively, you can
provide your own certificate.

The following instructions can be used as an example to bypass the warnings for
Chrome, but note that different browsers and operating systems will have
slightly different steps.

1. Download the certificate directly from the browser. For example, if using
   Google Chrome, click the “Not Secure” section on the left of the URL bar and
   select “Certificate is not valid” to show the certificate. Then click Details
   tab and click Export at the bottom.
2. Once you have the certificate, you will need to trust it on your machine. For
   MacOS, you can open the Keychain Access app. Select System under System
   Keychains. Then go to File > Import Items... and import the certificate you
   downloaded in the previous step.
3. Once imported, select the certificate and right-click to select "Get Info".
   Expand the Trust section, and change the value of "When using this
   certificate" to "Always Trust".
4. You should now refresh the browser and see that you can proceed to open the
   application. For Chrome, the application will remain “Not Secure” due to the
   fact that this is a self-signed certificate. If you have trouble accessing
   Graph Explorer after completing the previous step and reloading the browser,
   consider running a docker restart command and refreshing the browser again.

<!-- prettier-ignore -->
> [!TIP]
> To get rid of the “Not Secure” warning, see
[Using self-signed certificates on Chrome](../development.md#using-self-signed-certificates-on-chrome).

## Schema Sync Fails

This can happen for many reasons. Below are a few of the common ones.

### Mismatched Proxy Server URL

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

### Timeout

There are multiple sources of timeouts.

- Database server
- Networking layer (load balancer, proxy, etc)
- Browser
- Graph Explorer connection configuration

The error you receive in Graph Explorer can interpret Neptune timeout errors and
timeouts from Graph Explorer's configuration.

### Out of Memory

This can happen when your database is very large. Graph Explorer does its best
to support larger databases and is always improving. Please
[file an issue](https://github.com/aws/graph-explorer/issues/new/choose) if you
encounter this situation.

### Proxy Server Cannot Be Reached

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

## Backup Graph Explorer Data

Inside of Graph Explorer there is an option to export all the configuration data
that Graph Explorer uses. This data is local to the user’s browser and does not
exist on the server.

To gather the config data:

1. Launch Graph Explorer
2. Navigate to the connections screen
3. Press the “Settings” button in the navigation bar
4. Select the “General” page within settings
5. Press the “Save Configuration” button
6. Choose where to save the exported file

This backup can be restored using the “Load Configuration” button in the same
settings page.

## Gathering SageMaker Logs

The Graph Explorer proxy server outputs log statements to standard out. By
default, these logs will be forwarded to CloudWatch if the Notebook has the
proper permissions.

To gather these logs:

1. Open the AWS Console
2. Navigate to the Neptune page
3. Select “Notebook” from the sidebar
4. Find the Notebook hosting Graph Explorer
5. Open the details screen for that Notebook
6. In the “Actions” menu, choose “View Details in SageMaker”
7. Press the “View Logs” link in the SageMaker details screen under the field
   titled “Lifecycle configuration”
8. Scroll down to the “Log Streams” panel in the CloudWatch details where you
   should find multiple log streams
9. For each log stream related to Graph Explorer (LifecycleConfigOnStart.log,
   graph-explorer.log)
   1. Open the log stream
   2. In the “Actions” menu, choose “Download search results (CSV)”

### Graph Explorer Log Stream Does Not Exist

New Neptune Notebooks automatically apply the correct IAM permissions to write
to CloudWatch. If your Notebook does not automatically create a
graph-explorer.log in the CloudWatch Log Streams, then it is possible that the
Neptune Notebook was created before those IAM permissions were added. You’ll
need to add those permissions manually.

Below are examples of which IAM permissions you need for Graph Explorer.

- [IAM permissions for Neptune DB](https://raw.githubusercontent.com/aws/graph-explorer/main/additionaldocs/deployment/aws-sagemaker/graph-explorer-neptune-db-policy.json)
- [IAM permissions for Neptune Analytics](https://raw.githubusercontent.com/aws/graph-explorer/main/additionaldocs/deployment/aws-sagemaker/graph-explorer-neptune-analytics-policy.json)
