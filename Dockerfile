# syntax=docker/dockerfile:1
FROM amazonlinux:2023 AS base
ENV NODE_VERSION=24.4.0

RUN yum update -y && \
    yum install -y tar xz && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then NODE_ARCH="x64"; \
    elif [ "$ARCH" = "aarch64" ]; then NODE_ARCH="arm64"; \
    else echo "Unsupported architecture: $ARCH" && exit 1; fi && \
    curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz | tar -xJ -C /usr/local --strip-components=1 && \
    npm install --global corepack@latest && \
    corepack enable && \
    yum remove -y tar xz && \
    yum clean all && \
    rm -rf /var/cache/yum

FROM base
ARG NEPTUNE_NOTEBOOK

ENV NEPTUNE_NOTEBOOK=$NEPTUNE_NOTEBOOK
ENV HOME=/graph-explorer

# Conditionally set the following environment values using +/- variable expansion
# https://docs.docker.com/reference/dockerfile/#environment-replacement
# 
# If NEPTUNE_NOTEBOOK value is set then
#   - GRAPH_EXP_ENV_ROOT_FOLDER = /proxy/9250/explorer
#   - PROXY_SERVER_HTTP_PORT    = 9250
#   - LOG_STYLE                 = cloudwatch
# Else the values are the defaults
#   - GRAPH_EXP_ENV_ROOT_FOLDER = /explorer
#   - PROXY_SERVER_HTTP_PORT    = 80
#   - LOG_STYLE                 = default

ENV GRAPH_EXP_ENV_ROOT_FOLDER=${NEPTUNE_NOTEBOOK:+/proxy/9250/explorer}
ENV GRAPH_EXP_ENV_ROOT_FOLDER=${GRAPH_EXP_ENV_ROOT_FOLDER:-/explorer}

ENV PROXY_SERVER_HTTP_PORT=${NEPTUNE_NOTEBOOK:+9250}
ENV PROXY_SERVER_HTTP_PORT=${PROXY_SERVER_HTTP_PORT:-80}

ENV LOG_STYLE=${NEPTUNE_NOTEBOOK:+cloudwatch}
ENV LOG_STYLE=${LOG_STYLE:-default}

WORKDIR /
COPY . /graph-explorer/
WORKDIR /graph-explorer

RUN pnpm install && \
    pnpm build && \
    pnpm clean:dep && \
    pnpm install --prod --ignore-scripts && \
    rm -rf $HOME/.local && \
    chmod a+x ./process-environment.sh && \
    chmod a+x ./docker-entrypoint.sh

EXPOSE 443
EXPOSE 80
EXPOSE 9250
ENTRYPOINT ["./docker-entrypoint.sh"]
