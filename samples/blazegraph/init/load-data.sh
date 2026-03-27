#!/bin/bash
set -e

MARKER_FILE="/var/blazegraph/.data_loaded"

# If the marker file exists, skip loading
if [ -f "$MARKER_FILE" ]; then
  echo "Sample data already loaded — skipping."
  exit 0
fi

# Wait for Blazegraph to become available
echo "Waiting for Blazegraph to start..."
until curl -s http://localhost:9999/blazegraph >/dev/null; do
  sleep 2
done

echo "Blazegraph is up! Loading sample.ttl..."

# Load the RDF data into the default namespace (kb)
curl -s -X POST \
  -H 'Content-Type: text/turtle' \
  --data-binary @/init/sample-data.ttl \
  "http://localhost:9999/blazegraph/namespace/kb/sparql" \
  -o /dev/null

# Create a marker so we know data has been loaded
touch "$MARKER_FILE"
echo "✅ Data loaded successfully and marker file created."
