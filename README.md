# Graph Explorer
Open source version for the Graph Explorer.

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
- `pnpm build`
- `dist` folder is created in the graph-explorer directory.
- Serve the static site using the method of your choice,
for example, using `serve` npm package.

### Environment variables

You can find a template for the following environment variables at `/packages/graph-explorer/.env`.

#### Optional
- `REACT_APP_ENV_ROOT_FOLDER`: Base folder for the public files. By default, `/` (`string`). 
- `REACT_APP_CONNECTION_NAME`: Default connection name. Blank by default (`string`).
- `REACT_APP_CONNECTION_ENGINE`: Default connection query engine work with the instance. By default, `gremlin` (`gremlin | sparql`).
- `HTTPS_PROXY_SERVER_CONNECTION`: Creates self-signed cert if true. Provide a https url for `Public URL` in the connection pane if true. By default `true` (`boolean`).

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
- Change `gremlin.tinkergraph.vertexIdManager` and `gremlin.tinkergraph.edgeIdManager` in `/conf/tinkergraph-empty.properties` to support string ids. You can use `ANY`.
- Build and run the docker container as normal.

### Connecting to BlazeGraph
- Build and run the docker container as normal and connect the proxy server to BlazeGraph and your workbench to the proxy server.
- If using docker, ensure that the container running the workbench can properly access the container running BlazeGraph. You can find documentation on how to connect containers via docker networks [here](https://docs.docker.com/network/).

### Using the Proxy Server
- When creating a connection, insert the url to access your proxy server, which is `http(s)://localhost:8182` from the context of the host machine, into the Public URL field. Check `Neptune or BlazeGraph` since you won't be using the proxy with Gremlin-Server, and fill in the Graph Connection URL with the endpoint that the proxy server should make requests to. Ensure that you don't end the Graph Connection URLs with `/`.

## Authentication

Authentication is enabled using the SigV4 signing process for AWS Neptune connections found [here](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html).

### Use
- To use auth, you must run requests through the proxy server. This is where credentials are resolved and the signing logic is.
- For further information on how to properly have credentials resolved, refer to this [documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html)
- To use the SharedIniFileCredentials or ProcessCredentials, place your `.aws` folder at the root of the project before creating the docker container.
- To set up a connection with auth enabled, click `Neptune or BlazeGraph`, then `Neptune Authorization Enabled` and insert the correct region.

### Potential Errors
- If the explorer crashes, you can recreate the container or run `pnpm start` inside of `/packages/graph-explorer`.
- If the proxy-server crashes, you can recreate the container or run `pnpm start` inside of `/packages/graph-explorer-proxy-server`
- If the proxy-server fails to start, check that the provided endpoint is properly spelled and that you have access to from the environment you are trying to run in. If you are in a different VPC, consider VPC Peering.

## License
This project is licensed under the Apache-2.0 License.
