# Neptune Graph Explorer
Open source version for the Neptune Graph Explorer powered by Expero Connected.

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
- `REACT_APP_ENV_ROOT_FOLDER`: Base folder for the public files. By default, `/` (`string`).
- `REACT_APP_STORE_ID`: IndexedDB store identifier, By default, `cge` (`string`).
- `REACT_APP_STORE_NAME`: IndexedDB store name. By default, `default` (`string`).
- `REACT_APP_STORE_VERSION`: IndexedDB store version. By default, `1.0` (`number`).
- `REACT_APP_CONNECTION_URL`: Default connection to Neptune instance. Blank by default (`string`).
- `REACT_APP_CONNECTION_ENGINE`: Default connection query engine work with the Neptune instance. 
By default, `gremlin` (`gremlin` or `sparql`).
- `REACT_APP_AWS_AUTH_REQUIRED`: Enable authenticated requests. By default, `false` (`boolean`).
- `REACT_APP_AWS_REGION`: AWS region of your Neptune instance. By default `us-east-1` (`string`).
- `REACT_APP_AWS_SERVICE`: Neptune service name. By default `neptune-db` (`string`).
- `REACT_APP_AWS_CLUSTER_HOST`: Internal Neptune host to sign requests (`string`).
- `PROXY_SERVER_CONNECTION_URL`: Proxy server url.

### Docker Instructions
- To build the image, `docker build -t neptune-graph-explorer .` from the root directory.
- To run the image in a container, run 
`docker run -dit -p 5173:5173 -p 8182:8182 --name {container_name} neptune-graph-explorer`.

### Connecting to Gremlin-Server
- Change the channelized type in the configuration file (`/conf/gremlin-server.yaml` by default) being used to support HTTP (ex. org.apache.tinkerpop.gremlin.server.channel.WsAndHttpChannelizer)
- Remove “.withStrategies(ReferenceElementStrategy)” from `/scripts/generate-modern.groovy` so that properties are returned.
- Change `gremlin.tinkergraph.vertexIdManager` and `gremlin.tinkergraph.edgeIdManager` in `/conf/tinkergraph-empty.properties` to support string ids.
- Build and run the docker container as normal, substituting the url to access your gremlin-server in the `REACT_APP_CONNECTION_URL` env variable.

### Connecting to BlazeGraph
- Build and run the docker container as normal and connect to BlazeGraph through the proxy server.

### Using the Proxy Server
- Set `PROXY_SERVER_CONNECTION_URL` to the url that accesses your database. If needed you can change the port inside `node-server.js`.
- Set `REACT_APP_CONNECTION_URL` to the url that accesses your proxy server.

### Using Auth
- To use auth, you must run requests through the proxy server. This is where your credentials are resolved and the signing logic is.
- For further information on how to properly have credentials resolved, refer to this documentation: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html

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
