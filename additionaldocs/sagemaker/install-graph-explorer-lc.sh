#!/bin/bash

sudo -u ec2-user -i <<'EOF'

echo "export GRAPH_NOTEBOOK_SERVICE=neptune-db" >> ~/.bashrc # Set to `neptune-graph` for Neptune Analytics.
echo "export GRAPH_NOTEBOOK_HOST=CHANGE-ME" >> ~/.bashrc # Set to the endpoint of your Neptune instance
echo "export GRAPH_NOTEBOOK_PORT=8182" >> ~/.bashrc # Set to the port of your Neptune instance
echo "export GRAPH_NOTEBOOK_AUTH_MODE=IAM" >> ~/.bashrc # Set to `DEFAULT` if using DB cluster that is not IAM enabled. Leave as `IAM` for Neptune Analytics.
echo "export AWS_REGION=us-west-2" >> ~/.bashrc # Set to AWS region of Neptune instance and notebook.
echo "export NEPTUNE_LOAD_FROM_S3_ROLE_ARN=" >> ~/.bashrc # Sets IAM role for Neptune DB bulk loads via graph-notebook.

EXPLORER_VERSION=""
NOTEBOOK_VERSION=""

source activate JupyterSystemEnv

echo "installing Python 3 kernel"
python3 -m ipykernel install --sys-prefix --name python3 --display-name "Python 3"

echo "installing python dependencies..."
pip uninstall NeptuneGraphNotebook -y # legacy uninstall when we used to install from source in s3

pip install "jupyter_core<=5.3.2"
pip install "jupyter_server<=2.7.3"
pip install "jupyter-console<=6.4.0"
pip install "jupyter-client<=6.1.12"
pip install "ipywidgets==7.7.2"
pip install "jupyterlab_widgets==1.1.1"
pip install "notebook==6.4.12"
pip install "nbclient<=0.7.0"
pip install awswrangler

if [[ ${NOTEBOOK_VERSION} == "" ]]; then
  pip install --upgrade graph-notebook
else
  pip install --upgrade graph-notebook==${NOTEBOOK_VERSION}
fi

echo "installing nbextensions..."
python -m graph_notebook.nbextensions.install

echo "installing static resources..."
python -m graph_notebook.static_resources.install

echo "enabling visualization..."
if [[ ${NOTEBOOK_VERSION//./} < 330 ]] && [[ ${NOTEBOOK_VERSION} != "" ]]; then
  jupyter nbextension install --py --sys-prefix graph_notebook.widgets
fi
jupyter nbextension enable  --py --sys-prefix graph_notebook.widgets

mkdir -p ~/SageMaker/Neptune
cd ~/SageMaker/Neptune || exit
python -m graph_notebook.notebooks.install
chmod -R a+rw ~/SageMaker/Neptune/*

source ~/.bashrc || exit
HOST=${GRAPH_NOTEBOOK_HOST}
PORT=${GRAPH_NOTEBOOK_PORT}
SERVICE=${GRAPH_NOTEBOOK_SERVICE:-"neptune-db"}
AUTH_MODE=${GRAPH_NOTEBOOK_AUTH_MODE}
SSL=${GRAPH_NOTEBOOK_SSL}
LOAD_FROM_S3_ARN=${NEPTUNE_LOAD_FROM_S3_ROLE_ARN}

if [[ ${SSL} -eq "" ]]; then
  SSL="True"
fi

echo "Creating config with
HOST:                       ${HOST}
PORT:                       ${PORT}
SERVICE:                    ${SERVICE}
AUTH_MODE:                  ${AUTH_MODE}
SSL:                        ${SSL}
AWS_REGION:                 ${AWS_REGION}"

/home/ec2-user/anaconda3/envs/JupyterSystemEnv/bin/python -m graph_notebook.configuration.generate_config \
  --host "${HOST}" \
  --port "${PORT}" \
  --neptune_service "${SERVICE}" \
  --auth_mode "${AUTH_MODE}" \
  --ssl "${SSL}" \
  --load_from_s3_arn "${LOAD_FROM_S3_ARN}" \
  --aws_region "${AWS_REGION}"

echo "Adding graph_notebook.magics to ipython config..."
if [[ ${NOTEBOOK_VERSION//./} > 341 ]] || [[ ${NOTEBOOK_VERSION} == "" ]]; then
  /home/ec2-user/anaconda3/envs/JupyterSystemEnv/bin/python -m graph_notebook.ipython_profile.configure_ipython_profile
else
  echo "Skipping, unsupported on graph-notebook<=3.4.1"
fi

echo "graph-notebook installation complete."

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

start_graph_explorer_with_cw_logs() {
    docker run -d -p 9250:9250 \
      --restart always \
      --log-driver=awslogs \
      --log-opt awslogs-region=${AWS_REGION} \
      --log-opt awslogs-group=/aws/sagemaker/NotebookInstances \
      --log-opt awslogs-stream=${GRAPH_NOTEBOOK_NAME}/graph-explorer.log \
      --env LOG_LEVEL=debug \
      --env HOST=127.0.0.1 \
      --env PUBLIC_OR_PROXY_ENDPOINT=${EXPLORER_URI} \
      --env GRAPH_CONNECTION_URL=${NEPTUNE_URI} \
      --env USING_PROXY_SERVER=true \
      --env IAM=${IAM} \
      --env AWS_REGION=${AWS_REGION} \
      --env SERVICE_TYPE=${SERVICE} \
      --env PROXY_SERVER_HTTPS_CONNECTION=false \
      --env NEPTUNE_NOTEBOOK=true public.ecr.aws/neptune/graph-explorer:${EXPLORER_ECR_TAG}
}

start_graph_explorer_with_default_logs() {
    docker run -d -p 9250:9250 \
      --restart always \
      --env LOG_LEVEL=debug \
      --env HOST=127.0.0.1 \
      --env PUBLIC_OR_PROXY_ENDPOINT=${EXPLORER_URI} \
      --env GRAPH_CONNECTION_URL=${NEPTUNE_URI} \
      --env USING_PROXY_SERVER=true \
      --env IAM=${IAM} \
      --env AWS_REGION=${AWS_REGION} \
      --env SERVICE_TYPE=${SERVICE} \
      --env PROXY_SERVER_HTTPS_CONNECTION=false \
      --env NEPTUNE_NOTEBOOK=true public.ecr.aws/neptune/graph-explorer:${EXPLORER_ECR_TAG}
}

output=$(start_graph_explorer_with_cw_logs 2>&1)
exit_status=$?

if [[ $exit_status -ne 0 ]]; then
  if [[ "$output" == *"logging driver"* ]]; then
    echo "Failed to start Graph Explorer Docker container with AWS log driver. Please check that your notebook has sufficient CloudWatch IAM permissions."
    echo "Retrying with default JSON file logging driver..."
    start_graph_explorer_with_default_logs
  else
    echo "$output"
    exit 1
  fi
fi

echo "Graph Explorer installation done."

conda /home/ec2-user/anaconda3/bin/deactivate
echo "done."


EOF
