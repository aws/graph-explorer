---
title: "Deploy to Amazon EC2"
---

Deploy Graph Explorer onto an Amazon EC2 instance and use it as a proxy server with SSH tunneling to connect to Amazon Neptune.

:::note
This documentation is not an official recommendation on network setups as there are many ways to connect to Amazon Neptune from outside of the VPC, such as setting up a load balancer or VPC peering.
:::

## Prerequisites

- Provision an Amazon EC2 instance that will be used to host the application and connect to Neptune as a proxy server. For more details, see instructions [here](https://github.com/aws/graph-notebook/tree/main/additional-databases/neptune).
- Ensure the Amazon EC2 instance can send and receive on ports `22` (SSH), `8182` (Neptune), and `443` or `80` depending on protocol used (graph-explorer).
- [Docker](https://docs.docker.com/get-docker/) installed on the EC2 instance
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed on the EC2 instance

## Steps

1. Open an SSH client and connect to the EC2 instance
2. Authenticate with the [Amazon ECR Public Registry](https://docs.aws.amazon.com/AmazonECR/latest/public/public-registries.html#public-registry-auth)
   ```
   aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
   ```
3. Pull the Docker image
   ```
   docker pull public.ecr.aws/neptune/graph-explorer
   ```

:::tip
If you receive an error relating to the docker service not running, run
`service docker start`.
:::

4. Run the container substituting the `{hostname-or-ip-address}` with the hostname or IP address of the EC2 instance
   ```
   docker run -p 80:80 -p 443:443 \
    --restart unless-stopped \
    --env HOST={hostname-or-ip-address} \
    public.ecr.aws/neptune/graph-explorer
   ```

:::tip
The `--restart unless-stopped` flag ensures the container automatically restarts after a host reboot or if the container crashes. See Docker's [restart policy documentation](https://docs.docker.com/engine/containers/start-containers-automatically/) for other options.
:::

5. Navigate to the public URL of your EC2 instance accessing the `/explorer` endpoint. You will receive a warning as the SSL certificate used is self-signed. The URL will look like this:

```
https://ec2-1-2-3-4.us-east-1.compute.amazonaws.com/explorer
```

6. Since the application is set to use HTTPS by default and contains a self-signed certificate, you will need to add the Graph Explorer certificates to the trusted certificates directory and manually trust them. See [HTTPS Connections](./troubleshooting.md#https-connections) section.
7. After completing the trusted certification step and refreshing the browser, you should now see the Connections UI.
