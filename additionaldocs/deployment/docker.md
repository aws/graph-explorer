# Docker Deployment

The quickest way to get started with Graph Explorer is to use the official
Docker image. You can find the latest version of the image on  
[Amazon's ECR Public Registry](https://gallery.ecr.aws/neptune/graph-explorer).

<!-- prettier-ignore -->
> [!NOTE]
> 
> Make sure to use the version of the image that does not include `sagemaker` in the tag.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
  installed on your machine

## Steps

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
   [HTTPS Connections](https-setup.md#https-connections) section.
6. After completing the trusted certification step and refreshing the browser,
   you should now see the Connections UI. See below description on Connections
   UI to configure your first connection to Amazon Neptune.

## Gremlin Server Database

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
