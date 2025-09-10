# Getting Started

This project contains the code needed to create a Docker image of the Graph
Explorer. The image will create the Graph Explorer application and proxy server
that will be served over the standard HTTP or HTTPS ports (HTTPS by default).

The proxy server will be created automatically, but will only be necessary if
you are connecting to Neptune. Gremlin-Server and BlazeGraph can be connected to
directly. Additionally, the image will create a self-signed certificate that can
be optionally used.

## Examples

## Troubleshooting

If the instructions above do not work for you, please see the
[Troubleshooting](../troubleshooting.md) page for more information. It contains
workarounds for common issues and information on how to diagnose other issues.
