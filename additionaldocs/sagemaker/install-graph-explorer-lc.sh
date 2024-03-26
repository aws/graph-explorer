#!/bin/bash

sudo -u ec2-user -i <<'EOF'

echo "export GRAPH_NOTEBOOK_AUTH_MODE=DEFAULT" >> ~/.bashrc  # set to IAM instead of DEFAULT if cluster is IAM enabled
echo "export GRAPH_NOTEBOOK_HOST=CHANGE-ME" >> ~/.bashrc
echo "export GRAPH_NOTEBOOK_SERVICE=neptune-db" >> ~/.bashrc # set to `neptune-db` for Neptune database or `neptune-graph` for Neptune Analytics
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

GRAPH_NOTEBOOK_DESCRIBE_OUTPUT=$(aws sagemaker describe-notebook-instance --notebook-instance-name ${GRAPH_NOTEBOOK_NAME} --region ${AWS_REGION})
if [ -z "$GRAPH_NOTEBOOK_DESCRIBE_OUTPUT" ]; then
  echo "DescribeNotebookInstance failed. Manually building Notebook URL from name."
  if [[ ${AWS_REGION} == "cn-north-1" || ${AWS_REGION} == "cn-northwest-1" ]]; then
    AWS_DOMAIN=com.cn
  else
    AWS_DOMAIN=aws
  fi
  EXPLORER_URI="https://${GRAPH_NOTEBOOK_NAME}.notebook.${AWS_REGION}.sagemaker.${AWS_DOMAIN}/proxy/9250"
else
  GRAPH_NOTEBOOK_URL=$(echo "$GRAPH_NOTEBOOK_DESCRIBE_OUTPUT" | jq -r 'try .Url catch empty')
  echo "Notebook URL from DescribeNotebookInstance: ${GRAPH_NOTEBOOK_URL}"
  EXPLORER_URI="https://${GRAPH_NOTEBOOK_URL}/proxy/9250"
fi

NEPTUNE_URI="https://${GRAPH_NOTEBOOK_HOST}:${GRAPH_NOTEBOOK_PORT}"
SERVICE=${GRAPH_NOTEBOOK_SERVICE:-"neptune-db"}
AWS_REGION=${AWS_REGION}

echo "AUTH_MODE from Lifecycle: ${GRAPH_NOTEBOOK_AUTH_MODE}"
if [[ ${GRAPH_NOTEBOOK_AUTH_MODE} == "IAM" ]]; then
  IAM=true
else
  IAM=false
fi

echo "Explorer URI: ${EXPLORER_URI}"
echo "Neptune URI: ${NEPTUNE_URI}"
echo "Neptune Service: ${SERVICE}"
echo "Explorer region: ${AWS_REGION}"
echo "Explorer IAM auth mode: ${IAM}"

ECR_TOKEN=$(curl -k https://public.ecr.aws/token/ | jq -r '.token')
LATEST_ECR_RELEASE=$(curl -k -H "Authorization: Bearer $ECR_TOKEN" https://public.ecr.aws/v2/neptune/graph-explorer/tags/list | jq -r '.tags | sort_by(split(".") | try map(tonumber) catch [0,0,0])[-1]')

echo "Pulling and starting graph-explorer..."
if [[ ${EXPLORER_VERSION} == "" ]]; then
  EXPLORER_ECR_TAG=sagemaker-${LATEST_ECR_RELEASE}
else
  if [[ ${EXPLORER_VERSION//./} -ge 140 ]]; then
    EXPLORER_ECR_TAG=sagemaker-${EXPLORER_VERSION}
  elif [[ ${EXPLORER_VERSION} == *latest* ]]; then
    EXPLORER_ECR_TAG=sagemaker-latest-SNAPSHOT
  elif [[ ${EXPLORER_VERSION} == *dev* ]]; then
    EXPLORER_ECR_TAG=sagemaker-dev
  else
    echo "Specified Graph Explorer version does not support use on SageMaker. Defaulting to latest release."
    EXPLORER_ECR_TAG=sagemaker-${LATEST_ECR_RELEASE}
  fi
fi
echo "Using explorer image tag: ${EXPLORER_ECR_TAG}"

docker run -d -p 9250:9250 \
  --restart always \
  --env HOST=127.0.0.1 \
  --env PUBLIC_OR_PROXY_ENDPOINT=${EXPLORER_URI} \
  --env GRAPH_CONNECTION_URL=${NEPTUNE_URI} \
  --env USING_PROXY_SERVER=true \
  --env IAM=${IAM} \
  --env AWS_REGION=${AWS_REGION} \
  --env SERVICE_TYPE=${SERVICE} \
  --env PROXY_SERVER_HTTPS_CONNECTION=false \
  --env NEPTUNE_NOTEBOOK=true public.ecr.aws/neptune/graph-explorer:${EXPLORER_ECR_TAG}

echo "Explorer installation done."

conda /home/ec2-user/anaconda3/bin/deactivate
echo "done."

EOF
