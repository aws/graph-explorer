#!/bin/sh

./process-environment.sh

CONFIGURATION_FOLDER_PATH=${CONFIGURATION_FOLDER_PATH:-"./packages/graph-explorer/"}
PROXY_SERVER_HTTPS_CONNECTION_VALUE=$(grep -e 'PROXY_SERVER_HTTPS_CONNECTION' $CONFIGURATION_FOLDER_PATH/.env | cut -d "=" -f 2)

if [ -n "$PROXY_SERVER_HTTPS_CONNECTION_VALUE" ] && [ "$PROXY_SERVER_HTTPS_CONNECTION_VALUE" == "true" ]; then
    CERT_DIR=/graph-explorer/packages/graph-explorer-proxy-server/cert-info \
        HOST="$HOST" \
        ./setup-ssl.sh
else
    echo "SSL disabled. Skipping self-signed certificate generation."
fi

echo "Starting graph explorer..."
cd /graph-explorer/packages/graph-explorer-proxy-server && NODE_ENV=production node dist/node-server.js
