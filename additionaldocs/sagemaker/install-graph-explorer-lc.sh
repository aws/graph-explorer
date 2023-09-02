#!/bin/bash

sudo -u ec2-user -i <<'EOF'

echo "export GRAPH_NOTEBOOK_AUTH_MODE=DEFAULT" >> ~/.bashrc  # set to IAM instead of DEFAULT if cluster is IAM enabled
echo "export GRAPH_NOTEBOOK_HOST=CHANGE-ME" >> ~/.bashrc
echo "export GRAPH_NOTEBOOK_PORT=8182" >> ~/.bashrc
echo "export AWS_REGION=us-west-2" >> ~/.bashrc  # modify region if needed

EXPLORER_VERSION=""
for i in "$@"
do
case $i in
    -ev=*|--explorer-version=*)
    EXPLORER_VERSION="${i#*=}"
    echo "set explorer version to ${EXPLORER_VERSION}"
    shift
    ;;
esac
done

source activate JupyterSystemEnv
source ~/.bashrc || exit

echo "Constructing explorer connection configuration..."

GRAPH_NOTEBOOK_NAME=$(jq '.ResourceName' /opt/ml/metadata/resource-metadata.json --raw-output)
echo "Grabbed notebook name: ${GRAPH_NOTEBOOK_NAME}"

if [[ ${AWS_REGION} == "cn-north-1" || ${AWS_REGION} == "cn-northwest-1" ]]; then
  AWS_DOMAIN=com.cn
else
  AWS_DOMAIN=aws
fi

EXPLORER_URI="https://${GRAPH_NOTEBOOK_NAME}.notebook.${AWS_REGION}.sagemaker.${AWS_DOMAIN}/proxy/9250"
NEPTUNE_URI="https://${GRAPH_NOTEBOOK_HOST}:${GRAPH_NOTEBOOK_PORT}"
AWS_REGION=${AWS_REGION}

echo "AUTH_MODE from Lifecycle: ${GRAPH_NOTEBOOK_AUTH_MODE}"
if [[ ${GRAPH_NOTEBOOK_AUTH_MODE} == "IAM" ]]; then
  IAM=true
else
  IAM=false
fi

echo "Explorer URI: ${EXPLORER_URI}"
echo "Neptune URI: ${NEPTUNE_URI}"
echo "Explorer region: ${AWS_REGION}"
echo "Explorer IAM auth mode: ${IAM}"

echo "Pulling and starting graph-explorer..."
if [[ ${EXPLORER_VERSION} == "" ]]; then
  EXPLORER_ECR_TAG=sagemaker-latest
else
  EXPLORER_ECR_TAG=sagemaker-${EXPLORER_VERSION}
fi
echo "Using explorer image tag: ${EXPLORER_ECR_TAG}"

docker run -d -p 9250:9250 \
  --env HOST=127.0.0.1 \
  --env PUBLIC_OR_PROXY_ENDPOINT=${EXPLORER_URI} \
  --env GRAPH_CONNECTION_URL=${NEPTUNE_URI} \
  --env USING_PROXY_SERVER=true \
  --env IAM=${IAM} \
  --env AWS_REGION=${AWS_REGION} \
  --env PROXY_SERVER_HTTPS_CONNECTION=false \
  --env NEPTUNE_NOTEBOOK=true public.ecr.aws/neptune/graph-explorer:${EXPLORER_ECR_TAG}

echo "Explorer installation done."

conda /home/ec2-user/anaconda3/bin/deactivate
echo "done."

EOF