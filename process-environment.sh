#!/bin/sh

CONFIGURATION_FOLDER_PATH=${CONFIGURATION_FOLDER_PATH:-"./packages/graph-explorer/"}
CONFIGURATION_FOLDER_PATH=${CONFIGURATION_FOLDER_PATH%/}

# Stops startup when the file can't be written. Without this, failed writes
# are silent and the server starts with settings it never received.
require_writable() {
    if ! { true >> "$1"; } 2>/dev/null; then
        echo "Graph Explorer can't start because it can't write $1. The container writes its settings to the configuration folder at startup, so $CONFIGURATION_FOLDER_PATH must be writable. Check that it isn't mounted read-only." >&2
        exit 1
    fi
}

if [ -f "./config.json" ]; then

    json=$(cat ./config.json)

    PUBLIC_OR_PROXY_ENDPOINT=$(echo "$json" | grep -o '"PUBLIC_OR_PROXY_ENDPOINT":[^,}]*' | cut -d '"' -f 4)
    GRAPH_TYPE=$(echo "$json" | grep -o '"GRAPH_TYPE":[^,}]*' | cut -d '"' -f 4)
    SERVICE_TYPE=$(echo "$json" | grep -o '"SERVICE_TYPE":[^,}]*' | cut -d '"' -f 4)
    USING_PROXY_SERVER=$(echo "$json" | grep -o '"USING_PROXY_SERVER":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    IAM=$(echo "$json" | grep -o '"IAM":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    GRAPH_CONNECTION_URL=$(echo "$json" | grep -o '"GRAPH_CONNECTION_URL":[^,}]*' | cut -d '"' -f 4)
    AWS_REGION=$(echo "$json" | grep -o '"AWS_REGION":[^,}]*' | cut -d '"' -f 4)
    PROXY_SERVER_HTTPS_CONNECTION=$(echo "$json" | grep -o '"PROXY_SERVER_HTTPS_CONNECTION":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    GRAPH_EXP_HTTPS_CONNECTION=$(echo "$json" | grep -o '"GRAPH_EXP_HTTPS_CONNECTION":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    NEPTUNE_NOTEBOOK=$(echo "$json" | grep -o '"NEPTUNE_NOTEBOOK":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
fi

if [ -n "$PUBLIC_OR_PROXY_ENDPOINT" ]; then
    require_writable "$CONFIGURATION_FOLDER_PATH/defaultConnection.json"
fi
require_writable "$CONFIGURATION_FOLDER_PATH/.env"

if [ -n "$NEPTUNE_NOTEBOOK" ]; then
    printf '\nNEPTUNE_NOTEBOOK=%s\n' "$NEPTUNE_NOTEBOOK" >> $CONFIGURATION_FOLDER_PATH/.env
    if [ "$NEPTUNE_NOTEBOOK" = "true" ]; then
      # The notebook preset serves over HTTP. Keep an HTTPS request the server
      # would read as true, so it can reject the conflict. Anything else,
      # such as a config.json null or number, falls back to the preset.
      case "$PROXY_SERVER_HTTPS_CONNECTION" in
        [Tt][Rr][Uu][Ee]) ;;
        *) PROXY_SERVER_HTTPS_CONNECTION="false" ;;
      esac
      GRAPH_EXP_HTTPS_CONNECTION="false"
      # Set port and log style unless explicitly overridden
      if [ -z "$PROXY_SERVER_HTTP_PORT" ]; then
          printf '\nPROXY_SERVER_HTTP_PORT=9250\n' >> $CONFIGURATION_FOLDER_PATH/.env
      fi
      if [ -z "$LOG_STYLE" ]; then
          printf '\nLOG_STYLE=cloudwatch\n' >> $CONFIGURATION_FOLDER_PATH/.env
      fi
    fi
else
    printf '\nNEPTUNE_NOTEBOOK=false\n' >> $CONFIGURATION_FOLDER_PATH/.env
fi

if [ -n "$PROXY_SERVER_HTTPS_CONNECTION" ]; then
  printf '\nPROXY_SERVER_HTTPS_CONNECTION=%s\n' "$PROXY_SERVER_HTTPS_CONNECTION" >> $CONFIGURATION_FOLDER_PATH/.env
else
  printf '\nPROXY_SERVER_HTTPS_CONNECTION=true\n' >> $CONFIGURATION_FOLDER_PATH/.env
fi

if [ -n "$GRAPH_EXP_HTTPS_CONNECTION" ]; then
  printf '\nGRAPH_EXP_HTTPS_CONNECTION=%s\n' "$GRAPH_EXP_HTTPS_CONNECTION" >> $CONFIGURATION_FOLDER_PATH/.env
else
  printf '\nGRAPH_EXP_HTTPS_CONNECTION=true\n' >> $CONFIGURATION_FOLDER_PATH/.env
fi

# Resolve the legacy PUBLIC_OR_PROXY_ENDPOINT/USING_PROXY_SERVER variables into
# GRAPH_CONNECTION_URL, mirroring transformLegacyConnection() in
# configuration.ts so the product has one legacy-resolution rule.
USING_PROXY_SERVER_LOWER=$(printf '%s' "$USING_PROXY_SERVER" | tr '[:upper:]' '[:lower:]')
IS_PROXY_CONNECTION=false
if [ "$USING_PROXY_SERVER_LOWER" = "true" ]; then
    IS_PROXY_CONNECTION=true
elif [ -z "$USING_PROXY_SERVER" ] && [ -n "$GRAPH_CONNECTION_URL" ]; then
    IS_PROXY_CONNECTION=true
fi

if [ "$IS_PROXY_CONNECTION" = "true" ]; then
    RESOLVED_CONNECTION_URL="$GRAPH_CONNECTION_URL"
elif [ -n "$PUBLIC_OR_PROXY_ENDPOINT" ]; then
    RESOLVED_CONNECTION_URL="$PUBLIC_OR_PROXY_ENDPOINT"
else
    RESOLVED_CONNECTION_URL="$GRAPH_CONNECTION_URL"
fi

# Update the default connection file with the configuration values
if [ -n "$RESOLVED_CONNECTION_URL" ]; then
    # Overwrite existing file with an empty string
    echo "" > $CONFIGURATION_FOLDER_PATH/defaultConnection.json

    printf '{\n"GRAPH_EXP_CONNECTION_URL":"%s",\n' "$RESOLVED_CONNECTION_URL" >> $CONFIGURATION_FOLDER_PATH/defaultConnection.json

    if [ -n "$SERVICE_TYPE" ]; then
        echo "\"GRAPH_EXP_SERVICE_TYPE\":\"${SERVICE_TYPE}\"," >> $CONFIGURATION_FOLDER_PATH/defaultConnection.json
    else
        echo "\"GRAPH_EXP_SERVICE_TYPE\":\"neptune-db\"," >> $CONFIGURATION_FOLDER_PATH/defaultConnection.json
    fi

    if [ -n "$GRAPH_TYPE" ]; then
        echo "\"GRAPH_EXP_GRAPH_TYPE\":\"${GRAPH_TYPE}\"," >> $CONFIGURATION_FOLDER_PATH/defaultConnection.json
    else
      if [ "$SERVICE_TYPE" = "neptune-graph" ]; then
        echo "\"GRAPH_EXP_GRAPH_TYPE\":\"openCypher\"," >> $CONFIGURATION_FOLDER_PATH/defaultConnection.json
      fi
    fi

    if [ -n "$IAM" ]; then
        echo "\"GRAPH_EXP_IAM\":${IAM}," >> $CONFIGURATION_FOLDER_PATH/defaultConnection.json
    else
        echo "\"GRAPH_EXP_IAM\":false," >> $CONFIGURATION_FOLDER_PATH/defaultConnection.json
    fi

    printf '"GRAPH_EXP_AWS_REGION":"%s"\n}\n' "$AWS_REGION" >> $CONFIGURATION_FOLDER_PATH/defaultConnection.json
fi
