# syntax=docker/dockerfile:1
# Declared before the first FROM so the base and build stages install the same
# Node.js and corepack.
ARG NODE_VERSION=24.22.2
ARG COREPACK_VERSION=0.36.0

# Pinned to a dated ECR Public snapshot for reproducible builds; bump to move forward.
# The tag also pins dnf repo metadata to that date, so the yum update below resolves
# against that snapshot and cannot reach anything published after it.
FROM public.ecr.aws/amazonlinux/amazonlinux:2023.12.20261112.0@sha256:5c6ed3b38335b2aa424a045f1e564c8c508409ead0ff3f8bf5e62c31b94082cb AS base
ARG NODE_VERSION
ARG COREPACK_VERSION
ENV NODE_VERSION=$NODE_VERSION

# Install Node.js and openssl, then remove everything not needed at runtime
# (package managers, python3, build tools) to minimize potential issues.
RUN yum update -y && \
    yum install -y tar xz openssl && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then NODE_ARCH="x64"; \
    elif [ "$ARCH" = "aarch64" ]; then NODE_ARCH="arm64"; \
    else echo "Unsupported architecture: $ARCH" && exit 1; fi && \
    curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz | tar -xJ -C /usr/local --strip-components=1 && \
    npm install --global corepack@${COREPACK_VERSION} && \
    corepack enable && \
    yum remove -y tar xz && \
    yum clean all && \
    rpm -qa 'python3*' | while read pkg; do rpm -e --nodeps "$pkg"; done && \
    rpm -qa 'dnf*' 'yum*' 'libdnf*' | while read pkg; do rpm -e --nodeps "$pkg"; done && \
    rm -rf /var/cache/yum /var/cache/dnf

# The client bundle is the same on every platform, so it builds once on the
# build host instead of under emulation, which is slow enough to hang. A
# --platform on a FROM <stage> line has no effect, so this stage names the
# image itself.
FROM --platform=$BUILDPLATFORM public.ecr.aws/amazonlinux/amazonlinux:2023.12.20261112.0@sha256:5c6ed3b38335b2aa424a045f1e564c8c508409ead0ff3f8bf5e62c31b94082cb AS build
ARG NODE_VERSION
ARG COREPACK_VERSION
RUN yum install -y tar xz && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then NODE_ARCH="x64"; \
    elif [ "$ARCH" = "aarch64" ]; then NODE_ARCH="arm64"; \
    else echo "Unsupported architecture: $ARCH" && exit 1; fi && \
    curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz | tar -xJ -C /usr/local --strip-components=1 && \
    npm install --global corepack@${COREPACK_VERSION} && \
    corepack enable

WORKDIR /graph-explorer
COPY . .
RUN pnpm install --frozen-lockfile && \
    pnpm build && \
    pnpm clean:dep && \
    chmod a+x ./process-environment.sh && \
    chmod a+x ./setup-ssl.sh && \
    chmod a+x ./docker-entrypoint.sh

FROM base

ENV HOME=/graph-explorer

COPY --from=build /graph-explorer /graph-explorer/
WORKDIR /graph-explorer

# Installed on the target platform, so any platform-specific package matches it.
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    npm uninstall -g npm && \
    corepack disable && \
    rm -rf /usr/local/bin/pnpm* /usr/local/bin/corepack && \
    rm -rf $HOME/.local && \
    rm -rf $HOME/.cache

EXPOSE 443
EXPOSE 80
EXPOSE 9250
ENTRYPOINT ["./docker-entrypoint.sh"]
