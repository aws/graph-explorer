## Development

This developer README details instructions for building on top of the graph-explorer application, or for configuring advanced settings, like using environment variables to switch to HTTP.

### Requirements

- pnpm >=10.28.1
- node >=24.13.0

#### Node Version

Ensure you are running the correct Node version. If you are using [NVM](https://github.com/nvm-sh/nvm), you can simply do:

```bash
nvm use
```

Otherwise, use whatever method you use to install [Node v24.13.0](https://nodejs.org/en/download).

#### Node Corepack

[Corepack](https://nodejs.org/api/corepack.html) is used to ensure the package manager used for the project is consistent.

```bash
corepack enable
```

### Supported Graph Data Models and Query Languages

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

At this point, Graph Explorer should be successfully running and it is asking you for connection details. This part is specific to your personal setup.

### Build for production

Building Graph Explorer is simple.

```bash
pnpm install
pnpm build
```

This will run the build across the both the client code and the proxy server code. You'll end up with two `dist` folders:

```
{ROOT_PATH}/packages/graph-explorer/dist/
{ROOT_PATH}/packages/graph-explorer-proxy-server/dist/
```

The recommended way to serve Graph Explorer is using the proxy server.

```bash
pnpm start
```

### Build and run with Docker

You can also build and run Graph Explorer as a Docker image from source.

```bash
docker build -t graph-explorer .
```

Run the container with HTTPS disabled for local use:

```bash
docker run -p 80:80 \
  --name graph-explorer \
  --env PROXY_SERVER_HTTPS_CONNECTION=false \
  --env GRAPH_EXP_HTTPS_CONNECTION=false \
  graph-explorer
```

Then open [http://localhost/explorer](http://localhost/explorer) in your browser.

### Managing dependencies

If you need to add, remove, or update a dependency you can easily do so from the root folder in the CLI:

```bash
# Adding a package for the react app
pnpm add react --filter graph-explorer

# Adding a dev only dependency for the server app
pnpm add -D vitest --filter graph-explorer-proxy-server
```

#### Preparation of a release

This repository is composed by 3 packages and a mono-repository structure itself. Then, you need to take into account 4 different `package.json` files:

- `<root>/package.json` is intended to keep the dependencies for managing the repository. It has utilities like linter, code formatter, or git checks.
- `<root>/packages/graph-explorer/package.json` is the package file that describes the UI client package.
- `<root>/packages/graph-explorer-proxy-server/package.json` is the package file for the node server which is in charge of authentication and redirection of requests.
- `<root>/packages/shared/package.json` is the package file for shared code between the client and server packages.

Each of these `package.json` files has an independent `version` property. However, in this project we should keep them correlated. Therefore, when a new release version is being prepared, the version number should be increased in all 4 files. Regarding the version number displayed in the user interface, it is specifically extracted from the `<root>/packages/graph-explorer/package.json`. file

### Supply chain security

The `pnpm-workspace.yaml` file includes several settings that harden the project against supply chain attacks. These may cause `pnpm install` to fail when adding new dependencies, which is intentional.

- **`minimumReleaseAge`** — Newly published package versions are blocked for 24 hours, giving the community time to discover and report compromised releases.
- **`strictDepBuilds`** — Any dependency that tries to run a build script (e.g. `postinstall`) will cause installation to fail unless it is explicitly listed in `onlyBuiltDependencies` or `ignoredBuiltDependencies`.
- **`blockExoticSubdeps`** — Transitive dependencies cannot resolve to git repositories or raw tarball URLs. Only direct dependencies in `package.json` may use exotic sources.
- **`trustPolicy`** — Refuses to install a package version whose publish-time trust evidence (provenance, signatures) is weaker than a previously published version of that package.

If `pnpm install` fails due to one of these checks, evaluate whether the dependency is safe and update `pnpm-workspace.yaml` accordingly.

### Local environment overrides

Create a `.env.local` file in `packages/graph-explorer/` to override environment variables without modifying tracked files. This file is gitignored and will not be committed.

Example `packages/graph-explorer/.env.local`:

```
GRAPH_EXP_DEV_PORT=5174
PROXY_SERVER_HTTP_PORT=8082
```

### Environment variables

For development-only variables like `GRAPH_EXP_DEV_PORT`, see [Development-only environment variables](#development-only-environment-variables).

#### `GRAPH_EXP_ENV_ROOT_FOLDER`

Base path used to serve the `graph-explorer` front end application.

Example: `/explorer`

- Optional
- Default: `/`
- Type: `string`

#### `HOST`

The public hostname of the server. This is used to generate the SSL certificate during the Docker build.

Example: `localhost`

- Required when using HTTPS connections
- Default is `localhost`
- Type: `string`

#### `GRAPH_EXP_HTTPS_CONNECTION`

Uses the self-signed certificate to serve Graph Explorer over https if true. Only used in Docker via the entrypoint script.

- Optional
- Default `true` in Docker, not set otherwise
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
- Default `false` in code, `true` in Docker via the entrypoint script
- Type: `boolean`

#### `PROXY_SERVER_CORS_ORIGIN`

Restricts which origins are allowed to make cross-origin requests to the proxy server. When set, only requests from these exact origins will receive CORS headers. When not set, all origins are allowed. Each origin must include the scheme and must not have a trailing slash or path.

Example: `https://my-app.example.com` or `https://app-a.example.com,https://app-b.example.com`

- Optional
- Default: all origins allowed
- Type: `string` (comma-separated for multiple origins)

#### `CONFIGURATION_FOLDER_PATH`

Override path for the folder containing `.env` and `defaultConnection.json`. When set, replaces the default path entirely.

- Optional
- Default: `<client root>` (`packages/graph-explorer`)
- Type: `string`

### Development-only environment variables

These variables only affect the local development server (`pnpm dev`) and have no effect on production builds or Docker.

#### `GRAPH_EXP_DEV_PORT`

Sets a fixed port for the Vite development server. When set, `strictPort` is enabled — Vite will fail with an error if the port is already in use rather than silently selecting another port. This ensures the dev server runs on the exact port you intend.

Example: `5174`

- Optional
- Default: Vite's default behavior (auto-selects an available port starting at 5173)
- Type: `number`

### Using self-signed certificates with Docker

- Self-signed certificates will use the hostname provided in the `docker run` command, so unless you have specific requirements, there are no extra steps here besides providing the hostname.
- If you would like to modify the certificate files, be aware that the Dockerfile will make automatic modifications on run in the [entrypoint script](https://github.com/aws/graph-explorer/blob/main/docker-entrypoint.sh), so you will need to remove these lines.
- If you only serve one of either the proxy server or Graph Explorer UI over an HTTPS connection and wish to download from the browser, you should navigate to the one served over HTTPS to download the certificate.
- The other certificate files can also be found at /packages/graph-explorer-proxy-server/cert-info/ on the Docker container that is created.

### Using Self-signed certificates on Chrome

For browsers like Safari and Firefox, [trusting the certificate from the browser](./references/security.md#https-connections) is enough to bypass the "Not Secure" warning. However, Chrome treats self-signed certificates differently. If you want to use a self-signed certificate on Chrome **without** the "Not Secure" warning and you do not have your own certificate, or one provided by Let's Encrypt, you can use the following instructions to add the root certificate and remove the warning. These instructions assume you're using an EC2 instance to run the Docker container for Graph Explorer.

1. After the Docker container is built and running, open a terminal prompt and SSH into your proxy server instance (e.g., EC2).
2. Get the container ID by running `sudo docker ps`
3. Copy the root certificate file (rootCA.crt) from the container to EC2: `sudo docker cp {container_id}:~/graph-explorer/packages/graph-explorer-proxy-server/cert-info/rootCA.crt ~/rootCA.crt`
4. Exit SSH session
5. Copy the root certificate file from EC2 to your local machine (where you would run Graph Explorer on Chrome): `scp -i {path_to_pem_file} {EC2_login}:~/rootCA.crt {path_on_local_to_place_file}` For example, `scp -i /Users/user1/EC2.pem ec2-user@XXX.XXX.XXX.XXX:~/rootCA.crt /Users/user1/downloads`
6. After copying the certificate from the container to your local machine's file system, you can delete the rootCA.crt file from the EC2 file store with `rm -rf ~/rootCA.crt`
7. Once you have the certificate, you will need to trust it on your machine. For MacOS, you can open the Keychain Access app. Select System under System Keychains. Then go to File > Import Items... and import the certificate you downloaded in the previous step.
8. Once imported, select the certificate and right-click to select "Get Info". Expand the Trust section, and change the value of "When using this certificate" to "Always Trust".
9. You should now refresh the browser and see that you can proceed to open the application. For Chrome, the application will remain "Not Secure" due to the fact that this is a self-signed certificate. If you have trouble accessing Graph Explorer after completing the previous step and reloading the browser, consider running a docker restart command and refreshing the browser again.

### Troubleshooting

- If you need more detailed logs, you can change the log level from `info` in the default .env file to `debug`. The logs will begin printing the error's stack trace.
- If Graph Explorer crashes, you can recreate the container or run `pnpm start`
- If Graph Explorer fails to start, check that the provided endpoint is properly spelled and that you have access to from the environment you are trying to run in. If you are in a different VPC, consider VPC Peering.
