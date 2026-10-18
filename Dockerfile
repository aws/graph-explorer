# syntax=docker/dockerfile:1
# The Vite+ image builds with the Node.js in .node-version and the pnpm in
# packageManager. Pinned by digest; keep the tag on the vite-plus catalog version.
FROM ghcr.io/voidzero-dev/vite-plus:1.1.0@sha256:15dedad6ab1f100c096aaebac6b0fb40ccf1f3dd0dd0169141e2a56588489b60 AS toolchain
WORKDIR /app

FROM toolchain AS build
# The image has no repository to hook into, so skip the Vite+ commit hooks.
ENV VP_GIT_HOOKS=0
COPY --chown=vp:vp . .
RUN vp install --frozen-lockfile && \
    vp run build && \
    rm -rf node_modules packages/*/node_modules && \
    chmod a+x ./process-environment.sh ./setup-ssl.sh ./docker-entrypoint.sh && \
    NODE_HOME="$(dirname "$(dirname "$(vp env which node | head -1)")")" && \
    mkdir /tmp/node && \
    cp "$NODE_HOME/bin/node" "$NODE_HOME/LICENSE" /tmp/node/

# Installed from the manifests alone, so the layer is reused until a
# dependency changes and never holds devDependencies.
FROM toolchain AS deps
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc .node-version ./
COPY --chown=vp:vp packages/graph-explorer/package.json packages/graph-explorer/
COPY --chown=vp:vp packages/graph-explorer-proxy-server/package.json packages/graph-explorer-proxy-server/
COPY --chown=vp:vp packages/shared/package.json packages/shared/
RUN vp install --prod --frozen-lockfile --ignore-scripts

# Pinned to a dated ECR Public snapshot for reproducible builds; bump to move forward.
# The tag also pins dnf repo metadata to that date, so the yum update below resolves
# against that snapshot and cannot reach anything published after it.
# openssl is for setup-ssl.sh. yum, dnf, and python3 come with the base image
# and are stripped.
FROM public.ecr.aws/amazonlinux/amazonlinux:2023.12.20261016.0 AS runtime
RUN yum update -y && \
    yum install -y openssl && \
    yum clean all && \
    rpm -qa 'python3*' | while read pkg; do rpm -e --nodeps "$pkg"; done && \
    rpm -qa 'dnf*' 'yum*' 'libdnf*' | while read pkg; do rpm -e --nodeps "$pkg"; done && \
    rm -rf /var/cache/yum /var/cache/dnf
# LICENSE carries the notices for the third-party code built into node.
COPY --from=build --chown=0:0 /tmp/node/node /usr/local/bin/node
COPY --from=build --chown=0:0 /tmp/node/LICENSE /usr/local/LICENSE

ENV HOME=/graph-explorer
WORKDIR /graph-explorer
COPY --from=deps --chown=0:0 /app ./
COPY --from=build --chown=0:0 /app ./

EXPOSE 443
EXPOSE 80
EXPOSE 9250
ENTRYPOINT ["./docker-entrypoint.sh"]
