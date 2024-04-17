# syntax=docker/dockerfile:1
FROM node:20.12.2-alpine
ARG NEPTUNE_NOTEBOOK
WORKDIR /
COPY . /graph-explorer/
WORKDIR /graph-explorer
# Keeping all the RUN commands on a single line reduces the number of layers and,
# as a result, significantly reduces the final image size.
RUN corepack enable && \
    pnpm install && \
    chmod a+x ./process-environment.sh
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
