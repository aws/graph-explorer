#!/bin/sh

if [ -f "./config.json" ]; then 

    json=$(cat ./config.json)

    PUBLIC_OR_PROXY_ENDPOINT=$(echo "$json" | grep -o '"PUBLIC_OR_PROXY_ENDPOINT":[^,}]*' | cut -d '"' -f 4)
    GRAPH_TYPE=$(echo "$json" | grep -o '"GRAPH_TYPE":[^,}]*' | cut -d '"' -f 4)
    USING_PROXY_SERVER=$(echo "$json" | grep -o '"USING_PROXY_SERVER":[^,}]*' | cut -d '"' -f 4)
    IAM=$(echo "$json" | grep -o '"IAM":[^,}]*' | cut -d '"' -f 4)
    GRAPH_CONNECTION_URL=$(echo "$json" | grep -o '"GRAPH_CONNECTION_URL":[^,}]*' | cut -d '"' -f 4)
    AWS_REGION=$(echo "$json" | grep -o '"AWS_REGION":[^,}]*' | cut -d '"' -f 4)

    # Update the .env file with the configuration values
    if [ -n "$PUBLIC_OR_PROXY_ENDPOINT" ]; then 
        echo -e "\nPUBLIC_OR_PROXY_ENDPOINT=${PUBLIC_OR_PROXY_ENDPOINT}" >> ./packages/graph-explorer/.env

        if [ -n "$GRAPH_TYPE" ]; then 
            echo "GRAPH_TYPE=${GRAPH_TYPE}" >> ./packages/graph-explorer/.env
        else 
            echo "GRAPH_TYPE=PG" >> ./packages/graph-explorer/.env
        fi

        if [ -n "$USING_PROXY_SERVER" ]; then 
            echo "USING_PROXY_SERVER=${USING_PROXY_SERVER}" >> ./packages/graph-explorer/.env
        else 
            echo "USING_PROXY_SERVER=false" >> ./packages/graph-explorer/.env
        fi 

        if [ -n "$IAM" ]; then 
            echo "IAM=${IAM}" >> ./packages/graph-explorer/.env
        else 
            echo "IAM=false" >> ./packages/graph-explorer/.env
        fi

        echo "GRAPH_CONNECTION_URL=${GRAPH_CONNECTION_URL}" >> ./packages/graph-explorer/.env
        echo "AWS_REGION=${AWS_REGION}" >> ./packages/graph-explorer/.env
    fi
fi 