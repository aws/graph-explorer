#!/bin/sh

if [ -f "./config.json" ]; then

    json=$(cat ./config.json)

    PUBLIC_OR_PROXY_ENDPOINT=$(echo "$json" | grep -o '"PUBLIC_OR_PROXY_ENDPOINT":[^,}]*' | cut -d '"' -f 4)
    GRAPH_TYPE=$(echo "$json" | grep -o '"GRAPH_TYPE":[^,}]*' | cut -d '"' -f 4)
    USING_PROXY_SERVER=$(echo "$json" | grep -o '"USING_PROXY_SERVER":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    IAM=$(echo "$json" | grep -o '"IAM":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    GRAPH_CONNECTION_URL=$(echo "$json" | grep -o '"GRAPH_CONNECTION_URL":[^,}]*' | cut -d '"' -f 4)
    AWS_REGION=$(echo "$json" | grep -o '"AWS_REGION":[^,}]*' | cut -d '"' -f 4)
    PROXY_SERVER_HTTPS_CONNECTION=$(echo "$json" | grep -o '"PROXY_SERVER_HTTPS_CONNECTION":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    GRAPH_EXP_HTTPS_CONNECTION=$(echo "$json" | grep -o '"GRAPH_EXP_HTTPS_CONNECTION":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    NEPTUNE_NOTEBOOK=$(echo "$json" | grep -o '"NEPTUNE_NOTEBOOK":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
fi

if [ -n "$NEPTUNE_NOTEBOOK" ]; then
    echo -e "\nNEPTUNE_NOTEBOOK=${NEPTUNE_NOTEBOOK}" >> ./packages/graph-explorer/.env
    if [ "$NEPTUNE_NOTEBOOK" == "true" ]; then
      # Override Proxy SSL setting if Neptune notebook
      PROXY_SERVER_HTTPS_CONNECTION="false"
      GRAPH_EXP_HTTPS_CONNECTION="false"
    fi
else
    echo -e "\nNEPTUNE_NOTEBOOK=false" >> ./packages/graph-explorer/.env
fi

if [ -n "$PROXY_SERVER_HTTPS_CONNECTION" ]; then
  echo -e "\nPROXY_SERVER_HTTPS_CONNECTION=${PROXY_SERVER_HTTPS_CONNECTION}" >> ./packages/graph-explorer/.env
else
  echo -e "\nPROXY_SERVER_HTTPS_CONNECTION=true" >> ./packages/graph-explorer/.env
fi

if [ -n "$GRAPH_EXP_HTTPS_CONNECTION" ]; then
  echo -e "\nGRAPH_EXP_HTTPS_CONNECTION=${GRAPH_EXP_HTTPS_CONNECTION}" >> ./packages/graph-explorer/.env
else
  echo -e "\nGRAPH_EXP_HTTPS_CONNECTION=true" >> ./packages/graph-explorer/.env
fi

# Update the .env file with the configuration values
if [ -n "$PUBLIC_OR_PROXY_ENDPOINT" ]; then 
    echo -e "{\n\"GRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT\":\"${PUBLIC_OR_PROXY_ENDPOINT}\"," >> ./packages/graph-explorer/defaultConnection.json

    if [ -n "$GRAPH_TYPE" ]; then 
        echo "\"GRAPH_EXP_GRAPH_TYPE\":\"${GRAPH_TYPE}\"," >> ./packages/graph-explorer/defaultConnection.json
    fi
    
    if [ -n "$USING_PROXY_SERVER" ]; then 
        echo "\"GRAPH_EXP_USING_PROXY_SERVER\":${USING_PROXY_SERVER}," >> ./packages/graph-explorer/defaultConnection.json
    else 
        echo "\"GRAPH_EXP_USING_PROXY_SERVER\":false," >> ./packages/graph-explorer/defaultConnection.json
    fi 

    if [ -n "$IAM" ]; then 
        echo "\"GRAPH_EXP_IAM\":${IAM}," >> ./packages/graph-explorer/defaultConnection.json
    else 
        echo "\"GRAPH_EXP_IAM\":false," >> ./packages/graph-explorer/defaultConnection.json
    fi

    echo "\"GRAPH_EXP_CONNECTION_URL\":\"${GRAPH_CONNECTION_URL}\"," >> ./packages/graph-explorer/defaultConnection.json
    echo -e "\"GRAPH_EXP_AWS_REGION\":\"${AWS_REGION}\"\n}" >> ./packages/graph-explorer/defaultConnection.json
fi
