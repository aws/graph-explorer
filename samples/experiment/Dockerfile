# Use Amazon Neptune Graph Explorer as the base image
FROM tinkerpop/gremlin-server:latest

# Copy the GraphML file into the container
COPY data/air-routes-small-latest.graphml /opt/gremlin-server/data/air-routes-small-latest.graphml

# Set working directory
WORKDIR $GREMLIN_HOME

RUN echo $GREMLIN_HOME

# Copy custom configurations
COPY gremlin-server.yaml conf/gremlin-server.yaml

# Expose Gremlin server port
EXPOSE 8182

# Start Gremlin Server
CMD ["/opt/gremlin-server/bin/gremlin-server.sh", "/opt/gremlin-server/conf/gremlin-server.yaml"]