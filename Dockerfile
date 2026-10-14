# syntax=docker/dockerfile:1
# Pinned to a dated ECR Public snapshot for reproducible builds; bump to move forward.
# The tag also pins dnf repo metadata to that date, so the yum update below resolves
# against that snapshot and cannot reach anything published after it.
FROM public.ecr.aws/amazonlinux/amazonlinux:2023.12.20261013.0 AS os
ENV NODE_VERSION=24.21.0

# Node.js and pnpm for the build stages. The runtime copies only the node binary.
FROM os AS toolchain
RUN yum update -y && \
    yum install -y tar xz && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then NODE_ARCH="x64"; \
    elif [ "$ARCH" = "aarch64" ]; then NODE_ARCH="arm64"; \
    else echo "Unsupported architecture: $ARCH" && exit 1; fi && \
    curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz | tar -xJ -C /usr/local --strip-components=1 && \
    npm install --global corepack@0.36.0 && \
    corepack enable
WORKDIR /graph-explorer

FROM toolchain AS build
# The image has no git, so skip installing the Vite+ commit hooks.
ENV VP_GIT_HOOKS=0
COPY . .
RUN pnpm install --frozen-lockfile && \
    pnpm build && \
    pnpm clean:dep && \
    chmod a+x ./process-environment.sh ./setup-ssl.sh ./docker-entrypoint.sh

# Installed from the manifests alone, so the layer is reused until a
# dependency changes and never holds devDependencies.
FROM toolchain AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/graph-explorer/package.json packages/graph-explorer/
COPY packages/graph-explorer-proxy-server/package.json packages/graph-explorer-proxy-server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# openssl is for setup-ssl.sh. Package managers and python3 are removed to keep
# the runtime to what it runs.
FROM os AS runtime
RUN yum update -y && \
    yum install -y openssl && \
    yum clean all && \
    rpm -qa 'python3*' | while read pkg; do rpm -e --nodeps "$pkg"; done && \
    rpm -qa 'dnf*' 'yum*' 'libdnf*' | while read pkg; do rpm -e --nodeps "$pkg"; done && \
    rm -rf /var/cache/yum /var/cache/dnf
COPY --from=toolchain /usr/local/bin/node /usr/local/bin/node

ENV HOME=/graph-explorer
WORKDIR /graph-explorer
COPY --from=build /graph-explorer ./
COPY --from=deps /graph-explorer/node_modules ./node_modules
COPY --from=deps /graph-explorer/packages/graph-explorer/node_modules ./packages/graph-explorer/node_modules
COPY --from=deps /graph-explorer/packages/graph-explorer-proxy-server/node_modules ./packages/graph-explorer-proxy-server/node_modules

EXPOSE 443
EXPOSE 80
EXPOSE 9250
ENTRYPOINT ["./docker-entrypoint.sh"]
