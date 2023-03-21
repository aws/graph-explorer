#!/bin/sh

if [ $(grep -e 'GRAPH_EXP_HTTPS_CONNECTION' ./packages/graph-explorer/.env | cut -d "=" -f 2) ]; then

    if [ $HOST ]; then
        echo "Generating new self-signed SSL cert using $HOST..."
        cd /graph-explorer/packages/graph-explorer-proxy-server/cert-info/
        sed -i "21s/$/ $HOST:*/" csr.conf
        sed -i "8s/$/ $HOST:*/" cert.conf
        openssl req -x509 -sha256 -days 356 -nodes -newkey rsa:2048 -subj "/CN=Graph Explorer/C=US/L=Seattle" -keyout rootCA.key -out rootCA.crt
        openssl genrsa -out ./server.key 2048
        openssl req -new -key ./server.key -out ./server.csr -config ./csr.conf
        openssl x509 -req -in ./server.csr -CA ./rootCA.crt -CAkey ./rootCA.key -CAcreateserial -out ./server.crt -days 365 -sha256 -extfile ./cert.conf
else
        echo "No HOST environment variable specified."
        if [ -f "./rootCA.key" ] && [ -f "./rootCA.crt" ] && [ -f "./rootCA.crt" ] && [ -f "./server.csr"] && [ -f "./server.crt"]; then
            echo "Found existing self-signed SSL certificate. Re-using existing cert."
    else
            echo "No existing self-signed SSL certificate found. Please specify --env HOST=<hostname> during docker run command to create SSL cert."
            exit 1
        fi
    fi

else
    echo "SSL disabled. Skipping self-signed certificate generation."
    exit 1
fi
echo "Starting graph explorer..."
pnpm -w start:proxy-server
