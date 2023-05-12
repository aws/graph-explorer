#!/bin/sh

if [ -f "./config.json" ]; then 

    json=$(cat ./config.json)

    PUBLIC_OR_PROXY_ENDPOINT=$(echo "$json" | grep -o '"PUBLIC_OR_PROXY_ENDPOINT":[^,}]*' | cut -d '"' -f 4)
    GRAPH_TYPE=$(echo "$json" | grep -o '"GRAPH_TYPE":[^,}]*' | cut -d '"' -f 4)
    USING_PROXY_SERVER=$(echo "$json" | grep -o '"USING_PROXY_SERVER":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    IAM=$(echo "$json" | grep -o '"IAM":[^,}]*' | cut -d ':' -f 2 | tr -d '[:space:]' | sed 's/"//g')
    GRAPH_CONNECTION_URL=$(echo "$json" | grep -o '"CONNECTION_URL":[^,}]*' | cut -d '"' -f 4)
    AWS_REGION=$(echo "$json" | grep -o '"AWS_REGION":[^,}]*' | cut -d '"' -f 4)
fi

# Update the .env file with the configuration values
if [ -n "$PUBLIC_OR_PROXY_ENDPOINT" ]; then 
    echo -e "\nGRAPH_EXP_PUBLIC_OR_PROXY_ENDPOINT=${PUBLIC_OR_PROXY_ENDPOINT}" >> ./packages/graph-explorer/.env

    if [ -n "$GRAPH_TYPE" ]; then 
        echo "GRAPH_EXP_GRAPH_TYPE=${GRAPH_TYPE}" >> ./packages/graph-explorer/.env
    else 
        echo "GRAPH_EXP_GRAPH_TYPE=PG" >> ./packages/graph-explorer/.env
    fi

    if [ -n "$USING_PROXY_SERVER" ]; then 
        echo "GRAPH_EXP_USING_PROXY_SERVER=${USING_PROXY_SERVER}" >> ./packages/graph-explorer/.env
    else 
        echo "GRAPH_EXP_USING_PROXY_SERVER=false" >> ./packages/graph-explorer/.env
    fi 

    if [ -n "$IAM" ]; then 
        echo "GRAPH_EXP_IAM=${IAM}" >> ./packages/graph-explorer/.env
    else 
        echo "GRAPH_EXP_IAM=false" >> ./packages/graph-explorer/.env
    fi

    echo "GRAPH_EXP_CONNECTION_URL=${GRAPH_CONNECTION_URL}" >> ./packages/graph-explorer/.env
    echo "GRAPH_EXP_AWS_REGION=${AWS_REGION}" >> ./packages/graph-explorer/.env
fi