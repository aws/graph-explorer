# Graph Explorer
The Graph Explorer project provides a React-based web application that enables users to visualize both property graph and RDF data and explore connections between data without having to write graph queries. You can connect to a graph database that supports either the [W3C RDF/SPARQL](https://www.w3.org/TR/sparql11-overview/) open standard or the open source [Apache TinkerPop Gremlin Server](https://tinkerpop.apache.org/).

To get started, you can deploy Graph Explorer on a local machine using [Docker Desktop](https://www.docker.com/products/docker-desktop/), or in the cloud using a container service such as [Amazon ECS](https://aws.amazon.com/ecs/). The Graph Explorer image is hosted on [Amazon ECR](https://aws.amazon.com/ecr/), and can also be pulled from [DockerHub](https://hub.docker.com/). 

Upon build, the Graph Explorer will be run at port 5173 and the proxy-server at port 8182. The proxy-server will be created automatically, but will only be necessary if you are connecting to Neptune. Gremlin-Server and BlazeGraph can be connected to directly. 

![A sample image of property graph created by Graph Explorer](./images/LPGIMDb.png)
![A sample image of RDF graph created by Graph Explorer](./images/RDFEPL.png)

## Getting Started

## Features

#### _Connections UI:_
You can create and manage connections to graph databases using this feature. Connections is accessible as the first screen after deploying the application, when you click `Open Connections` on the top-right. Click `+` on the top-right to add a new connection. You can also edit and delete connections.     

* __Add a new connection:__
   *  __Name:__ Enter a name for your connection (e.g., `MyNeptuneCluster`). 
   *  __Graph Type:__ Choose a graph data model that corresponds to your desired graph database. 
   *  __Public Endpoint:__ Provide the publicly accessible endpoint URL for a graph database, e.g., Gremlin Server. If connecting to Amazon Neptune, then provide a proxy endpoint URL that is accessible from outside the VPC, e.g., EC2.

* __Available Connections:__ Once a connection is created, this section will appear as a left-hand pane. When you create more than one connection to a graph database, you can only connect to and visualize from one graph database endpoint at a time. To select the active database, toggle the “Active” switch.

#### Supported Graph Types
- Labelled Property Graph (PG) using Gremlin
- Resource Description Framework (RDF) using SPARQL

## Development

### Requirements
- pnpm >=7.9.3
- node >=16.15.1

### Run in development mode
- `pnpm i`
- `pnpm start`

### Build for production
- `pnpm i`
- `pnpm build`
- `dist` folder is created in the graph-explorer directory.
- Serve the static site using the method of your choice,
for example, using `serve` npm package.

### Environment variables

You can find a template for the following environment variables at `/packages/graph-explorer/.env`. All variables described below are optional and will default to the given values.

- `GRAPH_EXP_ENV_ROOT_FOLDER`: Base folder for the public files. By default, `/` (`string`). 
- `GRAPH_EXP_CONNECTION_NAME`: Default connection name. Blank by default (`string`).
- `GRAPH_EXP_CONNECTION_ENGINE`: Default connection query engine work with the instance. By default, `gremlin` (`gremlin | sparql`).
- `GRAPH_EXP_HTTPS_CONNECTION`: Uses the self-signed cert to serve the Graph Explorer over https if true. By default `true` (`boolean`).
- `PROXY_SERVER_HTTPS_CONNECTION`: Uses the self-signed cert to serve the proxy-server over https if true. By default `true` (`boolean`).

### Docker Instructions

The docker image contains the code needed to create a runnable instance of the Explorer inside of a container. The image will create the Graph Explorer communicating through port 5173 and the proxy-server through port 8182. Additionally, it will create a self-signed cert that can be optionally used when `PROXY_SERVER_HTTPS_CONNECTION` or `GRAPH_EXP_HTTPS_CONNECTION` are set to true (default behavior).

- To build the image, `docker build --build-arg host=$(hostname -i) -t graph-explorer .` from the root directory. Required.
- To run the image in a container, run `docker run -dit -p 5173:5173 -p 8182:8182 --name {container_name} graph-explorer`. Optional, can be run as long as the image is there.

## Connection

### Connecting to Neptune
- Ensure that Graph Explorer has access to the Neptune instance by being in the same VPC or VPC peering. 
- If authentication is enabled, read query privileges are needed (See ReadDataViaQuery managed policy [here](https://docs.aws.amazon.com/neptune/latest/userguide/iam-data-access-examples.html#iam-auth-data-policy-example-read-query).

### Connecting to Gremlin-Server
- The Graph Explorer currently supports only HTTP(S) connections. When connecting to Gremlin-Server, ensure it is configured with a channelizer that support HTTP(S) (i.e. [Channelizer Documentation](https://tinkerpop.apache.org/javadocs/current/full/org/apache/tinkerpop/gremlin/server/Channelizer.html)). The Gremlin Server configuration can be usually found at: /conf/gremlin-server.yaml.
- Remove “.withStrategies(ReferenceElementStrategy)” from `/scripts/generate-modern.groovy` so that properties are returned.
- Change `gremlin.tinkergraph.vertexIdManager` and `gremlin.tinkergraph.edgeIdManager` in `/conf/tinkergraph-empty.properties` to support string ids. You can use `ANY`.
- Build and run the docker container as normal.

### Connecting to BlazeGraph
- Build and run the docker container as normal and connect the proxy-server to BlazeGraph and your workbench to the proxy-server.
- If using docker, ensure that the container running the workbench can properly access the container running BlazeGraph. You can find documentation on how to connect containers via docker networks [here](https://docs.docker.com/network/).

### Using HTTPS
- Self-signed certs will automatically resolve the hostname, so unless you have specific requirements, there are no extra steps here. 
- If you would like to modify the cert files, be aware that the Dockerfile is making automatic modifications on line 15 and 16, so you will need to remove these lines.

### Using the Proxy-Server
- When creating a connection, insert the url to access your proxy-server, which is `http(s)://localhost:8182` from the context of the host machine, into the Public URL field. Check `Connecting to Proxy-Server` since you won't be using the proxy with Gremlin-Server, and fill in the Graph Connection URL with the endpoint that the proxy-server should make requests to. Ensure that you don't end the Graph Connection URLs with `/`.

### HTTPS Connections
- If either of the Graph Explorer or the proxy-server are served over an https connection, you will have to bypass the warning message from the browser due to the certs being self-signed by retrieving the needed certs to trust from `/packages/graph-explorer-proxy-server/cert-info/` or by manually ignoring them from the browser. Once you retrive these cert files, you should add them to your trusted certs on your computer. Each OS is different, but a tutorial can be found via a quick google search. If you only serve the proxy-server over https and want to ignore the error in the browser, you might need to directly navigate to the proxy-server to ignore the cert error. 

## Authentication

Authentication is enabled using the SigV4 signing process for AWS Neptune connections found [here](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html).

### Use
- To use auth, you must run requests through the proxy-server. This is where credentials are resolved and the signing logic is.
- For further information on how to properly have credentials resolved, refer to this [documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html)
- To use the SharedIniFileCredentials or ProcessCredentials, place your `.aws` folder at the root of the project before creating the docker container.
- To set up a connection with auth enabled, click `Connecting to Proxy-Server`, then `AWS IAM Auth Enabled` and insert the correct region.

### Potential Errors
- If the explorer crashes, you can recreate the container or run `pnpm start` inside of `/packages/graph-explorer`.
- If the proxy-server crashes, you can recreate the container or run `pnpm start` inside of `/packages/graph-explorer-proxy-server`
- If the proxy-server fails to start, check that the provided endpoint is properly spelled and that you have access to from the environment you are trying to run in. If you are in a different VPC, consider VPC Peering.

## License
This project is licensed under the Apache-2.0 License.
