---
title: "Development"
---

Build instructions and development setup for contributing to Graph Explorer. For system design and key libraries, see [Architecture](./architecture.md).

## Requirements

- pnpm >=10.28.1
- node >=24.13.0

### Node Version

Ensure you are running the correct Node version. If you are using [NVM](https://github.com/nvm-sh/nvm), you can simply do:

```bash
nvm use
```

Otherwise, use whatever method you use to install [Node v24.13.0](https://nodejs.org/en/download).

### Node Corepack

[Corepack](https://nodejs.org/api/corepack.html) is used to ensure the package manager used for the project is consistent.

```bash
corepack enable
```

If `corepack` is not found, install it first with `npm install -g corepack@latest`.

## Run in development mode

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

## Build for production

```bash
pnpm install
pnpm build
```

This builds the React client into static assets at `packages/graph-explorer/dist/`. The proxy server has no build step — Node runs its TypeScript source directly using [native type stripping](https://nodejs.org/en/learn/typescript/run-natively#native-type-stripping).

Start the proxy server, which also serves the built client assets:

```bash
pnpm start
```

## Build and run with Docker

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

## Managing dependencies

If you need to add, remove, or update a dependency you can easily do so from the root folder in the CLI:

```bash
# Adding a package for the react app
pnpm add react --filter graph-explorer

# Adding a dev only dependency for the server app
pnpm add -D vitest --filter graph-explorer-proxy-server
```

### Preparation of a release

This repository is composed of 3 packages and a mono-repository structure itself. Then, you need to take into account 4 different `package.json` files:

- `<root>/package.json` is intended to keep the dependencies for managing the repository. It has utilities like linter, code formatter, or git checks.
- `<root>/packages/graph-explorer/package.json` is the package file that describes the UI client package.
- `<root>/packages/graph-explorer-proxy-server/package.json` is the package file for the node server which is in charge of authentication and redirection of requests.
- `<root>/packages/shared/package.json` is the package file for shared code between the client and server packages.

Each of these `package.json` files has an independent `version` property. However, in this project we should keep them correlated. Therefore, when a new release version is being prepared, the version number should be increased in all 4 files. Regarding the version number displayed in the user interface, it is specifically extracted from the `<root>/packages/graph-explorer/package.json` file.

## Supply chain security

The `pnpm-workspace.yaml` file includes several settings that harden the project against supply chain attacks. These may cause `pnpm install` to fail when adding new dependencies, which is intentional.

- **`minimumReleaseAge`** — Newly published package versions are blocked for 24 hours, giving the community time to discover and report compromised releases.
- **`strictDepBuilds`** — Any dependency that tries to run a build script (e.g. `postinstall`) will cause installation to fail unless it is explicitly listed in `onlyBuiltDependencies` or `ignoredBuiltDependencies`.
- **`blockExoticSubdeps`** — Transitive dependencies cannot resolve to git repositories or raw tarball URLs. Only direct dependencies in `package.json` may use exotic sources.
- **`trustPolicy`** — Refuses to install a package version whose publish-time trust evidence (provenance, signatures) is weaker than a previously published version of that package.

If `pnpm install` fails due to one of these checks, evaluate whether the dependency is safe and update `pnpm-workspace.yaml` accordingly.

## Local environment overrides

Create a `.env.local` file in `packages/graph-explorer/` to override environment variables without modifying tracked files. This file is gitignored and will not be committed.

Example `packages/graph-explorer/.env.local`:

```
GRAPH_EXP_DEV_PORT=5174
PROXY_SERVER_HTTP_PORT=8082
```

## Environment variables

See the [Configuration Reference](./configuration/) for all available environment variables including application settings and default connection options.

## Development-only environment variables

These variables only affect the local development server (`pnpm dev`) and have no effect on production builds or Docker.

### `GRAPH_EXP_DEV_PORT`

Sets a fixed port for the Vite development server. When set, `strictPort` is enabled — Vite will fail with an error if the port is already in use rather than silently selecting another port. This ensures the dev server runs on the exact port you intend.

Example: `5174`

- Optional
- Default: Vite's default behavior (auto-selects an available port starting at 5173)
- Type: `number`

## Using self-signed certificates with Docker

- Self-signed certificates will use the hostname provided in the `docker run` command, so unless you have specific requirements, there are no extra steps here besides providing the hostname.
- If you would like to modify the certificate files, be aware that the Dockerfile will make automatic modifications on run in the [entrypoint script](https://github.com/aws/graph-explorer/blob/main/docker-entrypoint.sh), so you will need to remove these lines.
- If you only serve one of either the proxy server or Graph Explorer UI over an HTTPS connection and wish to download from the browser, you should navigate to the one served over HTTPS to download the certificate.
- The other certificate files can also be found at /packages/graph-explorer-proxy-server/cert-info/ on the Docker container that is created.

## Using self-signed certificates on Chrome

See [Removing the "Not Secure" warning on Chrome](./security/#removing-the-not-secure-warning-on-chrome) in the security reference.

## Troubleshooting

- If you need more detailed logs, you can change the log level from `info` in the default .env file to `debug`. The logs will begin printing the error's stack trace.
- If Graph Explorer crashes, you can recreate the container or run `pnpm start`
- If Graph Explorer fails to start, check that the provided endpoint is properly spelled and that you have access to from the environment you are trying to run in. If you are in a different VPC, consider VPC Peering.
