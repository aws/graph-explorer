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

## Troubleshooting

If the instructions above do not work for you, please see the
[Troubleshooting](../troubleshooting.md) page for more information. It contains
workarounds for common issues and information on how to diagnose other issues.
