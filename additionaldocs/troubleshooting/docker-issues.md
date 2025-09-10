# Docker Container Issues

This guide covers common Docker-related issues when running Graph Explorer.

## Container Startup Issues

1. If the container does not start, or immediately stops, use
   `docker logs graph-explorer` to check the container console logs for any
   related error messages that might provide guidance on why graph-explorer did
   not start.
2. If you are having issues connecting graph-explorer to your graph database,
   use your browser's Developer Tools feature to monitor both the browser
   console and network calls to determine if here are any errors related to
   connectivity.

## Ports in Use

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

## HTTP Only

If you do not want to use SSL and HTTPS, you can disable it by setting the
following [environment variables](../deployment/configuration.md):

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

## HTTPS Connections

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
   Google Chrome, click the "Not Secure" section on the left of the URL bar and
   select "Certificate is not valid" to show the certificate. Then click Details
   tab and click Export at the bottom.
2. Once you have the certificate, you will need to trust it on your machine. For
   MacOS, you can open the Keychain Access app. Select System under System
   Keychains. Then go to File > Import Items... and import the certificate you
   downloaded in the previous step.
3. Once imported, select the certificate and right-click to select "Get Info".
   Expand the Trust section, and change the value of "When using this
   certificate" to "Always Trust".
4. You should now refresh the browser and see that you can proceed to open the
   application. For Chrome, the application will remain "Not Secure" due to the
   fact that this is a self-signed certificate. If you have trouble accessing
   Graph Explorer after completing the previous step and reloading the browser,
   consider running a docker restart command and refreshing the browser again.

<!-- prettier-ignore -->
> [!TIP]
> To get rid of the "Not Secure" warning, see
[Using self-signed certificates on Chrome](../development/development-setup.md#using-self-signed-certificates-on-chrome).
