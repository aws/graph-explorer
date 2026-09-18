# syntax=docker/dockerfile:1
# Pinned to a dated ECR Public snapshot for reproducible builds; bump to move forward.
# The tag also pins dnf repo metadata to that date, so the yum update below resolves
# against that snapshot and cannot reach anything published after it.
FROM public.ecr.aws/amazonlinux/amazonlinux:2023.12.20260914.0 AS base
ENV NODE_VERSION=24.21.0

# Install Node.js and openssl, then remove everything not needed at runtime
# (package managers, python3, build tools) to minimize potential issues.
RUN yum update -y && \
    yum install -y tar xz openssl && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then NODE_ARCH="x64"; \
    elif [ "$ARCH" = "aarch64" ]; then NODE_ARCH="arm64"; \
    else echo "Unsupported architecture: $ARCH" && exit 1; fi && \
    curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz | tar -xJ -C /usr/local --strip-components=1 && \
    npm install --global corepack@0.36.0 && \
    corepack enable && \
    yum remove -y tar xz && \
    yum clean all && \
    rpm -qa 'python3*' | while read pkg; do rpm -e --nodeps "$pkg"; done && \
    rpm -qa 'dnf*' 'yum*' 'libdnf*' | while read pkg; do rpm -e --nodeps "$pkg"; done && \
    rm -rf /var/cache/yum /var/cache/dnf

FROM base

ENV HOME=/graph-explorer

WORKDIR /
COPY . /graph-explorer/
WORKDIR /graph-explorer

RUN pnpm install --frozen-lockfile && \
    pnpm build && \
    pnpm clean:dep && \
    pnpm install --prod --frozen-lockfile --ignore-scripts && \
    npm uninstall -g npm && \
    corepack disable && \
    rm -rf /usr/local/bin/pnpm* /usr/local/bin/corepack && \
    rm -rf $HOME/.local && \
    rm -rf $HOME/.cache && \
    chmod a+x ./process-environment.sh && \
    chmod a+x ./setup-ssl.sh && \
    chmod a+x ./docker-entrypoint.sh

EXPOSE 443
EXPOSE 80
EXPOSE 9250
ENTRYPOINT ["./docker-entrypoint.sh"]
