## Development

This developer README details instructions for building on top of the
graph-explorer application, or for configuring advanced settings, like using
environment variables to switch to HTTP.

### Requirements

- pnpm >=9.10.0
- node >=20.17.0

#### Node Version

Ensure you are running the correct Node version. If you are using
[NVM](https://github.com/nvm-sh/nvm), you can simply do:

```bash
nvm use
```

Otherwise, use whatever method you use to install
[Node v20](https://nodejs.org/en/download).

#### Node Corepack

[Corepack](https://nodejs.org/api/corepack.html) is used to ensure the package
manager used for the project is consistent.

```bash
corepack enable
```

### Supported Graph Types

- Labelled Property Graph (PG) using Gremlin or openCypher
- Resource Description Framework (RDF) using SPARQL

### Run in development mode

Install any missing or updated dependencies.

```bash
pnpm install
```

Start the development servers.

```bash
pnpm dev
```

Launch your web browser of choice and navigate to

```
http://localhost:5173
```

At this point, Graph Explorer should be successfully running and it is asking
you for connection details. This part is specific to your personal setup.

### Build for production

Building Graph Explorer is simple.

```bash
pnpm install
pnpm build
```

This will run the build across the both the client code and the proxy server
code. You'll end up with two `dist` folders:

```
{ROOT_PATH}/packages/graph-explorer/dist/
{ROOT_PATH}/packages/graph-explorer-proxy-server/dist/
```

The recommended way to server Graph Explorer is using the proxy server.

```bash
pnpm start
```

However, if you want to run Graph Explorer without the proxy server, you can:

```bash
pnpm start:client
```

### Managing dependencies

If you need to add, remove, or update a dependency you can easily do so from the
root folder in the CLI:

```bash
# Adding a package for the react app
pnpm add react --filter graph-explorer

# Adding a dev only dependency for the server app
pnpm add -D vitest --filter graph-explorer-proxy-server
```

#### Preparation of a release

This repository is composed by 2 packages and a mono-repository structure
itself. Then, you need to take into account 3 different `package.json` files:

- `<root>/package.json` is intended to keep the dependencies for managing the
  repository. It has utilities like linter, code formatter, or git checks.
- `<root>/packages/graph-explorer/package.json` is the package file that
  describes the UI client package.
- `<root>/packages/graph-explorer-proxy-server/package.json` is the package file
  for the node server which is in charge of authentication and redirection of
  requests.

Each of these `package.json` files has an independent `version` property.
However, in this project we should keep them correlated. Therefore, when a new
release version is being prepared, the version number should be increased in all
3 files. Regarding the version number displayed in the user interface, it is
specifically extracted from the `<root>/packages/graph-explorer/package.json`.
file

### Environment variables

#### `GRAPH_EXP_ENV_ROOT_FOLDER`

Base path used to serve the `graph-explorer` front end application.

Example: `/explorer`

- Optional
- Default: `/`
- Type: `string`

#### `GRAPH_EXP_CONNECTION_NAME`

Default connection name.

- Optional
- Default is empty
- Type: `string`

#### `GRAPH_EXP_CONNECTION_ENGINE`

The query engine to use for the default connection.

- Optional
- Default is `gremlin`
- Valid values are `gremlin`, `openCypher`, or `sparql`
- Type: `string`

#### `HOST`

The public hostname of the server. This is used to generate the SSL certificate
during the Docker build.

Example: `localhost`

- Required when using HTTPS connections
- Default is empty
- Type: `string`

#### `GRAPH_EXP_HTTPS_CONNECTION`

Uses the self-signed certificate to serve the Graph Explorer over https if true.

- Optional
- Default `true`
- Type: `boolean`

#### `PROXY_SERVER_HTTPS_PORT`

The port to use for the HTTPS server.

- Optional
- Default `443`
- Type: `number`

#### `PROXY_SERVER_HTTP_PORT`

The port to use for the HTTP server.

- Optional
- Default `80`
- Type: `number`

#### `PROXY_SERVER_HTTPS_CONNECTION`

Uses the self-signed certificate to serve the proxy-server over https if true.

- Optional
- Default `true`
- Type: `boolean`

### Using self-signed certificates with Docker

- Self-signed certificates will use the hostname provided in the `docker run`
  command, so unless you have specific requirements, there are no extra steps
  here besides providing the hostname.
- If you would like to modify the certificate files, be aware that the
  Dockerfile will make automatic modifications on run, in lines 8 and 9 of the
  [entrypoint script](https://github.com/aws/graph-explorer/blob/main/docker-entrypoint.sh),
  so you will need to remove these lines.
- If you only serve one of either the proxy server or Graph Explorer UI over an
  HTTPS connection and wish to download from the browser, you should navigate to
  the one served over HTTPS to download the certificate.
- The other certificate files can also be found at
  /packages/graph-explorer-proxy-server/cert-info/ on the Docker container that
  is created.

### Using Self-signed certificates on Chrome

For browsers like Safari and Firefox,
[trusting the certificate from the browser](../README.md/#https-connections) is
enough to bypass the “Not Secure” warning. However, Chrome treats self-signed
certificates differently. If you want to use a self-signed certificate on Chrome
**without** the “Not Secure” warning and you do not have your own certificate,
or one provided by Let’s Encrypt, you can use the following instructions to add
the root certificate and remove the warning. These instructions assume you’re
using an EC2 instance to run the Docker container for Graph Explorer.

1. After the Docker container is built and running, open a terminal prompt and
   SSH into your proxy server instance (e.g., EC2).
2. Get the container ID by running `sudo docker ps`
3. Copy the root certificate file (rootCA.crt) from the container to EC2:
   `sudo docker cp {container_id}:~/graph-explorer/packages/graph-explorer-proxy-server/cert-info/rootCA.crt ~/rootCA.crt`
4. Exit SSH session
5. Copy the root certificate file from EC2 to your local machine (where you
   would run Graph Explorer on Chrome):
   `scp -i {path_to_pem_file} {EC2_login}:~/rootCA.crt {path_on_local_to_place_file}`
   For example,
   `scp -i /Users/user1/EC2.pem ec2-user@XXX.XXX.XXX.XXX:~/rootCA.crt /Users/user1/downloads`
6. After copying the certificate from the container to your local machine’s file
   system, you can delete the rootCA.crt file from the EC2 file store with
   `rm -rf ~/rootCA.crt`
7. Once you have the certificate, you will need to trust it on your machine. For
   MacOS, you can open the Keychain Access app. Select System under System
   Keychains. Then go to File > Import Items... and import the certificate you
   downloaded in the previous step.
8. Once imported, select the certificate and right-click to select "Get Info".
   Expand the Trust section, and change the value of "When using this
   certificate" to "Always Trust".
9. You should now refresh the browser and see that you can proceed to open the
   application. For Chrome, the application will remain “Not Secure” due to the
   fact that this is a self-signed certificate. If you have trouble accessing
   Graph Explorer after completing the previous step and reloading the browser,
   consider running a docker restart command and refreshing the browser again.

### Troubleshooting

- If you need more detailed logs, you can change the log level from `info` in
  the default .env file to `debug`. The logs will begin printing the error's
  stack trace.
- If Graph Explorer crashes, you can recreate the container or run `pnpm start`
- If Graph Explorer fails to start, check that the provided endpoint is properly
  spelled and that you have access to from the environment you are trying to run
  in. If you are in a different VPC, consider VPC Peering.
