# Development

Build instructions and development setup for contributing to Graph Explorer. For system design and key libraries, see [Architecture](./architecture.md).

## Requirements

- pnpm 12.8.1, pinned by `packageManager`
- node, pinned by `.node-version`

### Node Version

`.node-version` pins the Node.js version used for development, CI, and the Docker image. Use [Vite+](https://viteplus.dev), [fnm](https://github.com/Schniz/fnm), or [nvm](https://github.com/nvm-sh/nvm) to switch to it:

```bash
vp env use                    # Vite+
fnm use                       # fnm
nvm use $(cat .node-version)  # nvm only reads .nvmrc, so pass the version
```

Otherwise, install the version in `.node-version` from [nodejs.org](https://nodejs.org/en/download).

### pnpm version

`packageManager` in the root `package.json` pins the exact pnpm version, and you do not have to match it yourself. Any pnpm 11 or newer reads that field and hands the command to the pinned version, so install pnpm however you like and let it switch:

```bash
brew install pnpm            # or any method from https://pnpm.io/installation
pnpm --version               # prints the pinned version, not the one you installed
```

A global [Vite+](https://viteplus.dev/guide/) CLI also works. Its `pnpm` shim uses your installed pnpm by default; run `vp env on pnpm` to have it download the version in `packageManager` instead.

### Upgrading pnpm

Three files carry the pnpm version itself:

- `packageManager` in `package.json`, which is what self-managing pnpm and Vite+ in CI and the Docker build all resolve.
- `pnpm-lock.yaml`, which records the version under `packageManagerDependencies` plus an `integrity` for `pnpm` and for each `@pnpm/exe.*` platform package. `pnpm install` regenerates these entries; never hand-edit them. A hand-edited `packageManager` makes pnpm run the version you typed and rewrite these entries, even under `--frozen-lockfile`, so review a `packageManager` change as a toolchain change.
- The pnpm requirement at the top of this document.

Run `pnpm self-update <version>` from the repo root. It rewrites `packageManager`, and may also move that key and drop the empty `dependencies` object in `package.json`. Then run `pnpm install` to update the lockfile, update this document to the same version, commit `package.json` and `pnpm-lock.yaml` together, and confirm nothing shifted:

```bash
pnpm install --frozen-lockfile
pnpm checks
pnpm test
```

`.github/workflows/ci.yml` and the `Dockerfile` both get pnpm through Vite+, which reads the version from `packageManager`, so a pnpm bump needs no workflow or `Dockerfile` edit. CI uses [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp), and the image builds in the Vite+ image. On a major bump, check the "Set up Vite+" step and the Docker build on the pull request: if the pinned Vite+ cannot run the new pnpm major, upgrade Vite+ first. A Vite+ upgrade changes two pins in the same pull request: the `vite-plus` entry in `pnpm-workspace.yaml`, and the tag and digest on the `FROM ghcr.io/voidzero-dev/vite-plus` line in the `Dockerfile`.

`packageManager` carries no `+sha512` hash, so `pnpm self-update` can write the pin. When pnpm switches itself to the pinned version, it checks each download against the `integrity` in `pnpm-lock.yaml` and against npm's registry signature, so a tampered lockfile stops the install with "its npm registry signature could not be verified" rather than passing quietly. CI and the Docker build get pnpm through Vite+ instead, which checks the platform package it runs against the registry's `dist.integrity`, with no value committed in this repo.

A major bump is also where `pnpm-workspace.yaml` deserves a read. Since pnpm 12, a key that pnpm does not recognize fails the install with `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` instead of being ignored. So a setting removed or renamed upstream stops the install rather than quietly doing nothing. `pnpm config list` prints the `pnpm-workspace.yaml` settings pnpm resolved, which is the quickest way to check, though it lists neither pnpm's defaults nor anything from `.npmrc`.

### Tooling

[Vite+](https://viteplus.dev) runs linting, formatting, type checking, tests, and the pre-commit hook. It's a dev dependency, so `pnpm install` is all the setup it needs. Run `pnpm checks` for lint, format, and type checks, `pnpm test` or `pnpm test:watch` for tests, and `pnpm lint` or `pnpm format` to fix issues. A global `vp` CLI is optional; without one, `pnpm exec vp` works.

- Run `pnpm install` after pulling the switch to Vite+. It moves your pre-commit hook from Husky to `vp staged`.
- If `pnpm install` prints `core.hooksPath is already set`, your clone or global Git config points hooks somewhere else, and the Vite+ hook isn't installed. Run `git config --unset core.hooksPath` (add `--global` if the value is global), then `pnpm install` again.
- In VS Code, install the recommended Vite+ extension pack. In Zed, install `oxc-zed`.

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

The build pulls the Vite+ image from `ghcr.io` and the Amazon Linux base from `public.ecr.aws`. Behind a registry allowlist or proxy, allow or mirror both.

Run the container with HTTPS disabled for local use:

```bash
docker run -p 80:80 \
  --name graph-explorer \
  --env PROXY_SERVER_HTTPS_CONNECTION=false \
  graph-explorer
```

Then open [http://localhost/explorer](http://localhost/explorer) in your browser.

## Managing dependencies

If you need to add, remove, or update a dependency you can easily do so from the root folder in the CLI:

```bash
# Adding a package for the react app
pnpm add react --filter graph-explorer

# Adding a dev only dependency for the server app
pnpm add -D supertest --filter graph-explorer-proxy-server
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
- **`allowBuilds`** — A map giving each dependency that wants to run a build script (e.g. `postinstall`) an explicit `true` or `false`. Anything absent from the map fails the install, because pnpm's own `strictDepBuilds` is on by default.
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

See the [Configuration Reference](./references/configuration.md) for all available environment variables including application settings and default connection options.

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

See [Removing the "Not Secure" warning on Chrome](./references/security.md#removing-the-not-secure-warning-on-chrome) in the security reference.

## Troubleshooting

- For more detailed logs, set `LOG_LEVEL=debug`. See [Logging](./references/logging.md).
- If Graph Explorer crashes, you can recreate the container or run `pnpm start`
- If Graph Explorer fails to start, check that the provided endpoint is properly spelled and that you have access to from the environment you are trying to run in. If you are in a different VPC, consider VPC Peering.
