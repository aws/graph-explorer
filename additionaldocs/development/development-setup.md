# Local Development Setup

You can build the Docker image locally by following the steps below.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine
- [Git](https://git-scm.com/downloads) installed on your machine

## Steps

1. Clone the repository
   ```
   git clone https://github.com/aws/graph-explorer.git
   ```
2. Navigate to the repository
   ```
   cd graph-explorer
   ```
3. Build the image
   ```
   docker build -t graph-explorer .
   ```
4. Run the container (HTTPS disabled)
   ```
   docker run -p 80:80 \
     --name graph-explorer \
     --env PROXY_SERVER_HTTPS_CONNECTION=false \
     --env GRAPH_EXP_HTTPS_CONNECTION=false \
     graph-explorer
   ```
5. Connect to the Graph Explorer UI
   ```
   http://localhost/explorer
   ```
