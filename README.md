# Neptune Graph Explorer
Open source version for the Neptune Graph Explorer powered by Expero Connected.

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

#### Required
- `REACT_APP_AWS_AUTH_REQUIRED`: Enable authenticated requests. By default, `false` (`boolean`).
- `REACT_APP_AWS_CLUSTER_HOST`: Internal Neptune host to sign requests (`string`).

#### Optional
- `REACT_APP_ENV_ROOT_FOLDER`: Base folder for the public files. By default, `/` (`string`). 
- `REACT_APP_CONNECTION_URL`: Default connection to Neptune instance. Blank by default (`string`).
- `REACT_APP_STORE_ID`: IndexedDB store identifier, By default, `cge` (`string`).
- `REACT_APP_STORE_NAME`: IndexedDB store name. By default, `default` (`string`).
- `REACT_APP_STORE_VERSION`: IndexedDB store version. By default, `1.0` (`number`).
- `REACT_APP_CONNECTION_ENGINE`: Default connection query engine work with the Neptune instance. By default, `gremlin` (`gremlin | sparql`).
- `REACT_APP_AWS_REGION`: AWS region of your Neptune instance. By default `us-east-1` (`string`).
- `REACT_APP_AWS_SERVICE`: Neptune service name. By default `neptune-db` (`string`).
- `PROXY_SERVER_CONNECTION_URL`: Proxy server url.

### Docker Instructions
- To build the image, `docker build -t neptune-graph-explorer .` from the root directory. Required.
- To run the image in a container, run `docker run -dit -p 5173:5173 -p 8182:8182 --name {container_name} neptune-graph-explorer`. Optional, can be run as long as the image is there.

## Connection

### Connecting to Gremlin-Server
- When using Gremlin-Server, within the configuration file, ensure that you're using a channelizer class that allows the use of the HTTP protocol. In many files located in the `conf` directory [here](https://github.com/apache/tinkerpop/tree/master/gremlin-server), `channelizer` is set by default and may need to changed or be added to include HTTP based requests.   More information can be found [here](https://tinkerpop.apache.org/javadocs/current/full/org/apache/tinkerpop/gremlin/server/Channelizer.html).
- Remove “.withStrategies(ReferenceElementStrategy)” from `/scripts/generate-modern.groovy` so that properties are returned.
- Change `gremlin.tinkergraph.vertexIdManager` and `gremlin.tinkergraph.edgeIdManager` in `/conf/tinkergraph-empty.properties` to support string ids.
- Build and run the docker container as normal, substituting the url to access your gremlin-server in the `REACT_APP_CONNECTION_URL` env variable.

### Connecting to BlazeGraph
- Build and run the docker container as normal and connect to BlazeGraph through the proxy server.

### Using the Proxy Server
- Set `PROXY_SERVER_CONNECTION_URL` to the url that accesses your database. If needed you can change the port inside `node-server.js`.
- Set `REACT_APP_CONNECTION_URL` to the url that accesses your proxy server.
- The proxy server will check to make sure the url passed in for `PROXY_SERVER_CONNECTION_URL` is a reader endpoint. Beware that if you have a single-instance cluster (a cluster with no read-replicas), the reader endpoint will be allowed to write.
- For Neptune, you should ensure that your environment has access via being in the same VPC or VPC peering. Read query privileges are also needed (See ReadDataViaQuery managed policy here: https://docs.aws.amazon.com/neptune/latest/userguide/iam-data-access-examples.html#iam-auth-data-policy-example-read-query.

## Authentication

Authentication is enabled using the SigV4 signing process found [here](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html).

### Use
- To use auth, you must run requests through the proxy server. This is where credentials are resolved and the signing logic is.
- For further information on how to properly have credentials resolved, refer to this documentation: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html
- To use the SharedIniFileCredentials or ProcessCredentials, place your `.aws` folder at the root of the project before creating the docker container.

### Potential Errors
- If the explorer crashes, you can recreate the container or run `pnpm start` inside of `/packages/client`.
- If the proxy-server crashes, you can recreate the container or run `pnpm start` inside of `/packages/proxy-server`
- If the proxy-server fails to start, check that you have a read-only endpoint, that it is properly spelled, and that you have access to from the environment you are trying to run in. If you are in a different VPC, consider VPC Peering.

## License
Copyright 2022 Expero Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
