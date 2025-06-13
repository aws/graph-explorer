# syntax=docker/dockerfile:1
FROM amazonlinux:2023
ARG NEPTUNE_NOTEBOOK

ENV NVM_DIR=/root/.nvm
ENV NODE_VERSION=v24.2.0
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

# Keeping all the RUN commands on a single line reduces the number of layers and,
# as a result, significantly reduces the final image size.
RUN yum update -y && \
    yum install -y tar git findutils openssl && \
    mkdir -p $NVM_DIR && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && \
    source $NVM_DIR/nvm.sh && \
    nvm install $NODE_VERSION && \
    nvm alias default $NODE_VERSION && \
    nvm use $NODE_VERSION && \
    npm install --global corepack@latest && \
    corepack enable && \
    pnpm install && \
    pnpm build && pnpm clean:dep && pnpm install --prod --ignore-scripts && \
    yum clean all && \
    yum remove -y tar findutils git && \
    rm -rf /var/cache/yum && \
    rm -rf $HOME/.local && \
    chmod a+x ./process-environment.sh && \
    chmod a+x ./docker-entrypoint.sh

# Set node/npm in path so it can be used by the app when the container is run
ENV NODE_PATH=$NVM_DIR/versions/node/$NODE_VERSION/lib/node_modules
ENV PATH=$NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH

EXPOSE 443
EXPOSE 80
EXPOSE 9250
ENTRYPOINT ["./docker-entrypoint.sh"]
