## Development
This developer README details instructions for building on top of the graph-explorer application, or for configuring advanced settings, like using environment variables to switch to HTTP.

### Requirements
- pnpm >=7.9.3
- node >=16.15.1

### Supported Graph Types
- Labelled Property Graph (PG) using Gremlin
- Resource Description Framework (RDF) using SPARQL 

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
- `GRAPH_EXP_HTTPS_CONNECTION`: Uses the self-signed certificate to serve the Graph Explorer over https if true. By default `true` (`boolean`).
- `PROXY_SERVER_HTTPS_CONNECTION`: Uses the self-signed certificate to serve the proxy-server over https if true. By default `true` (`boolean`).

### Using self-signed certificates in Docker

- Self-signed certificates will use the hostname provided in the Docker build command, so unless you have specific requirements, there are no extra steps here besides providing the hostname.
- If you would like to modify the certificate files, be aware that the Dockerfile is making automatic modifications on line 15 and 16, so you will need to remove these lines. 
- If you only serve one of either the proxy server or Graph Explorer UI over an HTTPS connection and wish to download from the browser, you should navigate to the one served over HTTPS to download the certificate.
- The other certificate files can also be found at /packages/graph-explorer-proxy-server/cert-info/ on the Docker container that is created. 

### Troubleshooting
- If the Graph Explore crashes, you can recreate the container or run `pnpm start` inside of `/packages/graph-explorer`.
- If the proxy-server crashes, you can recreate the container or run `pnpm start` inside of `/packages/graph-explorer-proxy-server`
- If the proxy-server fails to start, check that the provided endpoint is properly spelled and that you have access to from the environment you are trying to run in. If you are in a different VPC, consider VPC Peering.
