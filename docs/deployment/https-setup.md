# HTTPS Setup

This guide covers HTTPS configuration and certificate management for Graph
Explorer deployments.

## HTTPS Configuration

Graph Explorer supports the HTTPS protocol by default and provides a self-signed
certificate as part of the Docker image. You can choose to use HTTP instead by
changing the [environment variable default settings](configuration.md).

## HTTPS Connections

If either Graph Explorer or the proxy-server are served over an HTTPS connection
(which it is by default), you will have to bypass the warning message from the
browser due to the included certificate being a self-signed certificate. You can
bypass by manually ignoring them from the browser or downloading the correct
certificate and configuring them to be trusted. Alternatively, you can provide
your own certificate. The following instructions can be used as an example to
bypass the warnings for Chrome, but note that different browsers and operating
systems will have slightly different steps.

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
> 
> To get rid of the "Not Secure" warning, see
[Using self-signed certificates on Chrome](../development/development-setup.md#using-self-signed-certificates-on-chrome).
