# syntax=docker/dockerfile:1
FROM amazonlinux:2022
ARG NEPTUNE_NOTEBOOK
ENV NVM_DIR /root/.nvm
ENV NODE_VERSION v20.12.2
WORKDIR /
COPY . /graph-explorer/
WORKDIR /graph-explorer
# Keeping all the RUN commands on a single line reduces the number of layers and,
# as a result, significantly reduces the final image size.
RUN yum update -y && \
    yum install -y tar gzip git findutils openssl && \
    mkdir -p $NVM_DIR && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && \
    source $NVM_DIR/nvm.sh && \
    nvm install $NODE_VERSION && \
    nvm alias default $NODE_VERSION && \
    nvm use $NODE_VERSION && \
    corepack enable && \
    pnpm install && \
    yum clean all && \
    yum remove -y tar gzip findutils && \
    rm -rf /var/cache/yum && \
    chmod a+x ./process-environment.sh
# Set node/npm in path so we can reuse it in the next run layer
ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH
WORKDIR /graph-explorer/
ENV HOME=/graph-explorer
ENV NEPTUNE_NOTEBOOK=$NEPTUNE_NOTEBOOK
RUN if [ -n "$NEPTUNE_NOTEBOOK" ] && [ "$NEPTUNE_NOTEBOOK" = "true" ]; then \
      echo "GRAPH_EXP_ENV_ROOT_FOLDER=/proxy/9250/explorer" >> ./packages/graph-explorer/.env; \
    else \
      echo "GRAPH_EXP_ENV_ROOT_FOLDER=/explorer" >> ./packages/graph-explorer/.env; \
    fi && \
    pnpm build
EXPOSE 443
EXPOSE 80
EXPOSE 9250
RUN chmod a+x ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
