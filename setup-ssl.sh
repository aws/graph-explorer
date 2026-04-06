#!/bin/sh
#
# Generates or validates self-signed SSL certificates.
#
# Environment:
#   CERT_DIR  – directory for certificate files (required)
#   HOST      – hostname for SAN entries; when unset, expects existing certs
#

if [ -z "$CERT_DIR" ]; then
    echo "CERT_DIR is required" >&2
    exit 1
fi

if [ $HOST ]; then
    echo "Generating new self-signed SSL cert using $HOST..."
    sed -i'' -e "s/^DNS\.1 = .*/DNS.1 = $HOST:*/" "$CERT_DIR/csr.conf"
    sed -i'' -e "s/^DNS\.1 = .*/DNS.1 = $HOST:*/" "$CERT_DIR/cert.conf"
    openssl req -x509 -sha256 -days 356 -nodes -newkey rsa:2048 -subj "/CN=Graph Explorer/C=US/L=Seattle" -keyout "$CERT_DIR/rootCA.key" -out "$CERT_DIR/rootCA.crt"
    openssl genrsa -out "$CERT_DIR/server.key" 2048
    openssl req -new -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.csr" -config "$CERT_DIR/csr.conf"
    openssl x509 -req -in "$CERT_DIR/server.csr" -CA "$CERT_DIR/rootCA.crt" -CAkey "$CERT_DIR/rootCA.key" -CAcreateserial -out "$CERT_DIR/server.crt" -days 365 -sha256 -extfile "$CERT_DIR/cert.conf"
else
    echo "No HOST environment variable specified."
    if [ -f "$CERT_DIR/rootCA.key" ] && [ -f "$CERT_DIR/rootCA.crt" ] && [ -f "$CERT_DIR/rootCA.crt" ] && [ -f "$CERT_DIR/server.csr" ] && [ -f "$CERT_DIR/server.crt" ]; then
        echo "Found existing self-signed SSL certificate. Re-using existing cert."
    else
        echo "No existing self-signed SSL certificate found. Please specify --env HOST=<hostname> during docker run command to create SSL cert."
        exit 1
    fi
fi
