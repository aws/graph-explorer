# Getting Started

This project contains the code needed to create a Docker image of the Graph
Explorer. The image will create the Graph Explorer application and proxy server
that will be served over the standard HTTP or HTTPS ports (HTTPS by default).

The proxy server will be created automatically, but will only be necessary if
you are connecting to Neptune. Gremlin-Server and BlazeGraph can be connected to
directly. Additionally, the image will create a self-signed certificate that can
be optionally used.

## Examples

### Local Docker Setup

The quickest way to get started with Graph Explorer is to use the official
Docker image. You can find the latest version of the image on  
[Amazon's ECR Public Registry](https://gallery.ecr.aws/neptune/graph-explorer).

<!-- prettier-ignore -->
> [!NOTE]
> 
> Make sure to use the version of the image that does not include `sagemaker` in the tag.

#### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
  installed on your machine

#### Steps

1. Authenticate with the Amazon ECR Public Registry.
   [More information](https://docs.aws.amazon.com/AmazonECR/latest/public/public-registries.html#public-registry-auth)

   ```
   aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
   ```

2. Pull down the docker image

   ```
   docker pull public.ecr.aws/neptune/graph-explorer
   ```

3. Create and run a docker container using the image

   ```
   docker run -p 80:80 -p 443:443 \
    --env HOST=localhost \
    --name graph-explorer \
    public.ecr.aws/neptune/graph-explorer
   ```

   The `HOST` environment variable is used for SSL certificates generation since
   HTTPS is the default. If you are hosting this on a public domain, you should
   replace `HOST=localhost` with your domain name.

4. Open a browser and type in the URL of the Graph Explorer server instance

   ```
   https://localhost/explorer
   ```

5. You will receive a warning as the SSL certificate used is self-signed. Since
   the application is set to use HTTPS by default and contains a self-signed
   certificate, you will need to add the Graph Explorer certificates to the
   trusted certificates directory and manually trust them. See the
   [HTTPS Connections](#https-connections) section.
6. After completing the trusted certification step and refreshing the browser,
   you should now see the Connections UI. See below description on Connections
   UI to configure your first connection to Amazon Neptune.

#### Gremlin Server Database

Gremlin Server is an easy way to get started with graph databases. This example
will configure a simple Gremlin Server instance to be used with Graph Explorer.
It comes with a very small graph dataset.

1. Pull the latest Gremlin Server image from Docker Hub.
   ```
   docker pull tinkerpop/gremlin-server:latest
   ```
2. Create and run the Gremlin Server container using the HTTP REST modern
   configuration.
   ```
   docker run -p 8182:8182 \
     --name gremlin-server \
     tinkerpop/gremlin-server:latest \
     conf/gremlin-server-rest-modern.yaml
   ```
3. Open Graph Explorer and add a new connection
   - Name: `Gremlin Server`
   - Graph Type: `Gremlin`
   - Public or Proxy Endpoint: `https://localhost`
   - Using Proxy Server: `true`
   - Graph Connection URL: `http://localhost:8182`

## Amazon EC2 Setup

The following instructions detail how to deploy graph-explorer onto an Amazon
EC2 instance and use it as a proxy server with SSH tunneling to connect to
Amazon Neptune.

<!-- prettier-ignore -->
> [!NOTE]
> 
> This documentation is not an official recommendation on
network setups as there are many ways to connect to Amazon Neptune from outside
of the VPC, such as setting up a load balancer or VPC peering.

### Prerequisites

- Provision an Amazon EC2 instance that will be used to host the application and
  connect to Neptune as a proxy server. For more details, see instructions
  [here](https://github.com/aws/graph-notebook/tree/main/additional-databases/neptune).
- Ensure the Amazon EC2 instance can send and receive on ports `22` (SSH),
  `8182` (Neptune), and `443` or `80` depending on protocol used
  (graph-explorer).

### Steps

These steps describe how to install Graph Explorer on your Amazon EC2 instance.

1. Open an SSH client and connect to the EC2 instance.
2. Download and install the necessary command line tools such as
   [Git](https://git-scm.com/downloads) and
   [Docker](https://docs.docker.com/get-docker/).
3. Clone the repository
   ```
   git clone https://github.com/aws/graph-explorer.git
   ```
4. Navigate to the repository
   ```
   cd graph-explorer
   ```
5. Build the image
   ```
   docker build -t graph-explorer .
   ```

<!-- prettier-ignore -->
> [!TIP]
>
> If you receive an error relating to the docker service not running, run
> `service docker start`.

4. Run the container substituting the `{hostname-or-ip-address}` with the
   hostname or IP address of the EC2 instance.
   ```
   docker run -p 80:80 -p 443:443 \
    --env HOST={hostname-or-ip-address} \
    graph-explorer
   ```
5. Navigate to the public URL of your EC2 instance accessing the `/explorer`
   endpoint. You will receive a warning as the SSL certificate used is
   self-signed. The URL will look like this:
   ```
   https://ec2-1-2-3-4.us-east-1.compute.amazonaws.com/explorer
   ```
6. Since the application is set to use HTTPS by default and contains a
   self-signed certificate, you will need to add the Graph Explorer certificates
   to the trusted certificates directory and manually trust them. See
   [HTTPS Connections](#https-connections) section.
7. After completing the trusted certification step and refreshing the browser,
   you should now see the Connections UI.

## Local Development Setup

You can build the Docker image locally by following the steps below.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine
- [Git](https://git-scm.com/downloads) installed on your machine

### Steps

1. Clone the repository
   ```
   git clone https://github.com/aws/graph-explorer.git
   ```
2. Navigate to the repository
   ```
   cd graph-explorer
   ```
3. Build the image
   ```
   docker build -t graph-explorer .
   ```
4. Run the container (HTTPS disabled)
   ```
   docker run -p 80:80 \
     --name graph-explorer \
     --env PROXY_SERVER_HTTPS_CONNECTION=false \
     --env GRAPH_EXP_HTTPS_CONNECTION=false \
     graph-explorer
   ```
5. Connect to the Graph Explorer UI
   ```
   http://localhost/explorer
   ```

## Helpful Tips

### Troubleshooting

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
following [environment variables](../development.md#environment-variables):

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

### Schema Sync Fails

This can happen for many reasons. Here are a few of the common ones.

#### Timeout

There are multiple sources of timeouts.

- Database server
- Networking layer (load balancer, proxy, etc)
- Browser
- Graph Explorer connection configuration

The error you receive in Graph Explorer can interpret Neptune timeout errors and
timeouts from Graph Explorer's configuration.

#### Out of Memory

This can happen when your database is very large. Graph Explorer does its best
to support larger databases and is always improving. Please
[file an issue](https://github.com/aws/graph-explorer/issues/new/choose) if you
encounter this situation.

#### Proxy Server Cannot Be Reached

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
