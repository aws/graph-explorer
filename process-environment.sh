#!/bin/sh

CONFIGURATION_FOLDER_PATH=${CONFIGURATION_FOLDER_PATH:-"./packages/graph-explorer/"}

if [ -f "./config.json" ]; then

    json=$(cat ./config.json)

    GRAPH_TYPE=$(echo "$json" | grep -o '"GRAPH_TYPE":[^,}]*' | cut -d '"' -f 4)
    SERVICE_TYPE=$(echo "$json" | grep -o '"SERVICE_TYPE":[^,}]*' | cut -d '"' -f 4)
    IAM=$(echo "$json" | grep -o '"IAM":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    GRAPH_CONNECTION_URL=$(echo "$json" | grep -o '"GRAPH_CONNECTION_URL":[^,}]*' | cut -d '"' -f 4)
    AWS_REGION=$(echo "$json" | grep -o '"AWS_REGION":[^,}]*' | cut -d '"' -f 4)
    PROXY_SERVER_HTTPS_CONNECTION=$(echo "$json" | grep -o '"PROXY_SERVER_HTTPS_CONNECTION":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    GRAPH_EXP_HTTPS_CONNECTION=$(echo "$json" | grep -o '"GRAPH_EXP_HTTPS_CONNECTION":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    NEPTUNE_NOTEBOOK=$(echo "$json" | grep -o '"NEPTUNE_NOTEBOOK":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
fi

if [ "$NEPTUNE_NOTEBOOK" = "true" ]; then
    # Force SSL off for Neptune Notebook environments
    PROXY_SERVER_HTTPS_CONNECTION="false"
    GRAPH_EXP_HTTPS_CONNECTION="false"
    # Set port and log style unless explicitly overridden
    if [ -z "$PROXY_SERVER_HTTP_PORT" ]; then
        printf '\nPROXY_SERVER_HTTP_PORT=9250\n' >> $CONFIGURATION_FOLDER_PATH/.env
    fi
    if [ -z "$LOG_STYLE" ]; then
        printf '\nLOG_STYLE=cloudwatch\n' >> $CONFIGURATION_FOLDER_PATH/.env
    fi
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

# Update the default connection file with the configuration values
if [ -n "$GRAPH_CONNECTION_URL" ]; then
    # Overwrite existing file with an empty string
    echo "" > $CONFIGURATION_FOLDER_PATH/defaultConnection.json

    printf '{\n"GRAPH_EXP_CONNECTION_URL":"%s",\n' "$GRAPH_CONNECTION_URL" >> $CONFIGURATION_FOLDER_PATH/defaultConnection.json

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
