#!/bin/sh
set -e

./process-environment.sh

CONFIGURATION_FOLDER_PATH=${CONFIGURATION_FOLDER_PATH:-"./packages/graph-explorer/"}

if [ ! -f "$CONFIGURATION_FOLDER_PATH/.env" ]; then
    echo "Expected .env file not found at $CONFIGURATION_FOLDER_PATH/.env" >&2
    exit 1
fi

PROXY_SERVER_HTTPS_CONNECTION_VALUE=$(grep -e '^PROXY_SERVER_HTTPS_CONNECTION=' "$CONFIGURATION_FOLDER_PATH/.env" | cut -d "=" -f 2 || true)
NEPTUNE_NOTEBOOK_VALUE=$(grep -e '^NEPTUNE_NOTEBOOK=' "$CONFIGURATION_FOLDER_PATH/.env" | cut -d "=" -f 2 || true)

# The notebook preset serves HTTP only, so certificates would go unused. With
# HTTPS also requested the server refuses to start, and it has to get that far
# to name the conflict instead of failing here on a missing HOST.
# Exact match, the same rule process-environment.sh and the server apply.
if [ "$NEPTUNE_NOTEBOOK_VALUE" = "true" ]; then
    echo "Neptune Notebook preset enabled. Skipping self-signed certificate generation."
elif [ -n "$PROXY_SERVER_HTTPS_CONNECTION_VALUE" ] && [ "$PROXY_SERVER_HTTPS_CONNECTION_VALUE" = "true" ]; then
    CERT_DIR=/graph-explorer/packages/graph-explorer-proxy-server/cert-info \
        HOST="$HOST" \
        ./setup-ssl.sh
else
    echo "SSL disabled. Skipping self-signed certificate generation."
fi

echo "Starting graph explorer..."
# Stubbed in tests — update docker-entrypoint.test.ts if changing
cd /graph-explorer/packages/graph-explorer-proxy-server && NODE_ENV=production node src/node-server.ts
