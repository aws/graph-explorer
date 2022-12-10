# Graph Explorer
The Graph Explorer project provides a React-based web application that enables users to visualize both property graph and RDF data and explore connections between data without having to write graph queries. You can connect to a graph database that supports either the [W3C RDF/SPARQL](https://www.w3.org/TR/sparql11-overview/) open standard or the open source [Apache TinkerPop Gremlin Server](https://tinkerpop.apache.org/).

To get started, you can deploy Graph Explorer on a local machine using [Docker Desktop](https://www.docker.com/products/docker-desktop/), or in the cloud using a container service such as [Amazon ECS](https://aws.amazon.com/ecs/). The Graph Explorer image is hosted on [Amazon ECR](https://aws.amazon.com/ecr/), and can also be pulled from [DockerHub](https://hub.docker.com/). 

![A sample image of property graph created by Graph Explorer](./images/LPGIMDb.png)
![A sample image of RDF graph created by Graph Explorer](./images/RDFEPL.png)

## Getting Started

## Features
* *Connections UI:* You can create and manage connections to graph databases using this feature. Connections is accessible as the first screen after deploying the application, when you click “Open Connections” on the top-right. Click ‘+’ on the top-right to add a new connection. You can also edit and delete connections.
    * *Add a new connection:*
        * *Name:* Enter a name for your connection (e.g., MyNeptuneCluster). 
        * *Graph Type:* Choose a graph data model that corresponds to your desired graph database. 
        * *Public Endpoint:* Provide the publicly accessible endpoint URL for a graph database, e.g., Gremlin Server. If connecting to Amazon Neptune, then provide a proxy endpoint URL that is accessible from outside the VPC, e.g., EC2.



## Development

### Supported Graph Types
- Labelled Property Graph (PG) using Gremlin
- Resource Description Framework (RDF) using SPARQL

### Requirements
- pnpm >=7.9.3
- node >=16.15.1

### Run in development mode
- `pnpm i`
- `pnpm start`

### Build for production
- `pnpm i`
- `pnpm build:prod`
- `dist` folder is created in the client directory.
- Serve the static site using the method of your choice,
for example, using `serve` npm package.

### Environment variables

To change the .env file being used, navigate to `/graph-explorer/packages/proxy-server/node-server.js` and modify the file path provided inside the dotenv function. By default it is as follows: 

`dotenv.config({ path: "../client/.env.development" });`

#### Required
- `REACT_APP_AWS_AUTH_REQUIRED`: Enable authenticated requests. By default, `false` (`boolean`).
- `REACT_APP_AWS_CLUSTER_HOST`: Internal host to sign requests (`string`).

#### Optional
- `REACT_APP_ENV_ROOT_FOLDER`: Base folder for the public files. By default, `/` (`string`). 
- `REACT_APP_CONNECTION_NAME`: Default connection name. Blank by default (`string`).
- `REACT_APP_CONNECTION_URL`: Default connection to instance. Blank by default (`string`).
- `REACT_APP_STORE_ID`: IndexedDB store identifier, By default, `ge` (`string`).
- `REACT_APP_STORE_NAME`: IndexedDB store name. By default, `default` (`string`).
- `REACT_APP_STORE_VERSION`: IndexedDB store version. By default, `1.0` (`number`).
- `REACT_APP_CONNECTION_ENGINE`: Default connection query engine work with the instance. By default, `gremlin` (`gremlin | sparql`).
- `REACT_APP_AWS_REGION`: AWS region of your Neptune instance. By default `us-east-1` (`string`).
- `REACT_APP_AWS_SERVICE`: AWS service name. By default `neptune-db` (`string`).
- `PROXY_SERVER_CONNECTION_URL`: Proxy server url.

### Docker Instructions
- To build the image, `docker build -t graph-explorer .` from the root directory. Required.
- To run the image in a container, run `docker run -dit -p 5173:5173 -p 8182:8182 --name {container_name} graph-explorer`. Optional, can be run as long as the image is there.

## Connection

### Connecting to Neptune
- Ensure that your environment has access via being in the same VPC or VPC peering. 
- If authentication is enabled, read query privileges are needed (See ReadDataViaQuery managed policy [here](https://docs.aws.amazon.com/neptune/latest/userguide/iam-data-access-examples.html#iam-auth-data-policy-example-read-query).

### Connecting to Gremlin-Server
- The Graph Explorer currently supports only HTTP(S) connections. When connecting to Gremlin-Server, ensure it is configured with a channelizer that support HTTP(S) (i.e. [Channelizer Documentation](https://tinkerpop.apache.org/javadocs/current/full/org/apache/tinkerpop/gremlin/server/Channelizer.html)). The Gremlin Server configuration can be usually found at: /conf/gremlin-server.yaml.
- Remove “.withStrategies(ReferenceElementStrategy)” from `/scripts/generate-modern.groovy` so that properties are returned.
- Change `gremlin.tinkergraph.vertexIdManager` and `gremlin.tinkergraph.edgeIdManager` in `/conf/tinkergraph-empty.properties` to support string ids.
- Build and run the docker container as normal, substituting the url to access your gremlin-server in the `REACT_APP_CONNECTION_URL` env variable.

### Connecting to BlazeGraph
- Build and run the docker container as normal and connect to BlazeGraph through the proxy server.

### Using the Proxy Server
- Set `PROXY_SERVER_CONNECTION_URL` to the url that accesses your database. If needed you can change the port inside `node-server.js`.
- Set `REACT_APP_CONNECTION_URL` to the url that accesses your proxy server.

## Authentication

Authentication is enabled using the SigV4 signing process found [here](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html).

### Use
- To use auth, you must run requests through the proxy server. This is where credentials are resolved and the signing logic is.
- For further information on how to properly have credentials resolved, refer to this [documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html)
- To use the SharedIniFileCredentials or ProcessCredentials, place your `.aws` folder at the root of the project before creating the docker container.

### Potential Errors
- If the explorer crashes, you can recreate the container or run `pnpm start` inside of `/packages/client`.
- If the proxy-server crashes, you can recreate the container or run `pnpm start` inside of `/packages/proxy-server`
- If the proxy-server fails to start, check that the provided endpoint is properly spelled and that you have access to from the environment you are trying to run in. If you are in a different VPC, consider VPC Peering.

## License
This project is licensed under the Apache-2.0 License.
