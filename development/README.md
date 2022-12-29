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
