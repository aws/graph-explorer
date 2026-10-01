[← Guides](./)

# Launching Graph Explorer using Amazon SageMaker

Graph Explorer can be hosted and launched on Amazon SageMaker Notebooks via a lifecycle configuration script. To learn more about lifecycle configurations and how to create one, see the [documentation](https://docs.aws.amazon.com/sagemaker/latest/dg/notebook-lifecycle-config.html).

You can use the provided sample lifecycle configuration, [`./deploy-to-sagemaker/install-graph-explorer-lc.sh`](./deploy-to-sagemaker/install-graph-explorer-lc.sh), or create your own shell script. If using the sample lifecycle, you should also create an IAM role with a policy containing the permissions described in either [`./deploy-to-sagemaker/graph-explorer-neptune-db-policy.json`](./deploy-to-sagemaker/graph-explorer-neptune-db-policy.json) or [`./deploy-to-sagemaker/graph-explorer-neptune-analytics-policy.json`](./deploy-to-sagemaker/graph-explorer-neptune-analytics-policy.json), depending on the service used.

After you have created the lifecycle configuration and IAM role, you can attach them to a new or existing SageMaker notebook instance, under `Notebook instance settings` -> `Additional configuration` -> `Lifecycle configuration` and `Permission and encryption` -> `IAM role`, respectively.

When the notebook has been started and is in "Ready" state, you can access Graph Explorer by adding the `/proxy/9250/explorer/` extension to the base notebook URL. The Graph Explorer link should look something like:

```
https://graph-explorer-notebook-name.notebook.us-west-2.sagemaker.aws/proxy/9250/explorer/
```

> [!IMPORTANT]
>
> Graph Explorer performs no authentication or authorization, so controlling who can reach a deployment is the deployer's responsibility. Never expose it publicly without an access control layer in front of it. See [Access Control](../references/security.md#access-control).

## Network Requirements

Graph Explorer routes database requests through the proxy server running on the SageMaker notebook instance. This means the instance must have network access to any database you want to explore.

If your notebook instance is in a private subnet without a NAT gateway or internet gateway, it will not be able to reach databases outside the VPC. To connect to external databases, ensure the instance has the appropriate network routing (VPC peering, NAT gateway, transit gateway, etc.).

## Security model

The notebook environment provides the protections that let the sample lifecycle script serve Graph Explorer over plain HTTP:

- Jupyter terminates TLS, so browser traffic to the notebook is encrypted.
- Jupyter requires a signed-in AWS principal, so only authenticated users reach the proxy.
- The container listens on port `9250` and the Jupyter proxy reaches it over loopback.

The Jupyter proxy at `/proxy/9250/explorer/` is the only intended access path. Do not expose port `9250` any other way.

None of these properties travel with the settings. `PROXY_SERVER_HTTPS_CONNECTION=false` is safe here because of what surrounds the container. Copying it to another environment serves unauthenticated, unencrypted traffic.

## Logging and privacy

The sample lifecycle script sets `LOG_LEVEL=info`, which keeps database query text out of the logs. If you raise it to `debug`, query text is written to the CloudWatch log group `/aws/sagemaker/NotebookInstances`, which is shared with the notebook. Anyone who can read that log group can read the queries.

## Minimum Database Permissions

By default, the permission policy for the IAM role of the SageMaker instance will have full access to the Neptune Database or Neptune Analytics instance. This means queries executed within Graph Explorer could contain mutations.

To restrict Graph Explorer access for its most basic functionality you can use these minimum permissions.

- Read data via queries
- Get the graph summary information (used for schema sync)
- Cancel query

> [!CAUTION]
>
> If you are using the standard notebook setup, these policies will apply to both the Jupyter graph notebooks as well as Graph Explorer.

If a user attempts to execute a mutation query inside of Graph Explorer, they will be presented with an error that informs them they are not authorized for that request.

**Neptune DB**

```json
{
    "Effect": "Allow",
    "Action": [
        "neptune-db:CancelQuery",
        "neptune-db:ReadDataViaQuery",
        "neptune-db:GetGraphSummary"
    ],
    "Resource": [
        "arn:[AWS_PARTITION]:neptune-db:[AWS_REGION]:[AWS_ACCOUNT_ID]:[NEPTUNE_CLUSTER_RESOURCE_ID]/*"
    ]
},
```

**Neptune Analytics**

```json
{
  "Effect": "Allow",
  "Action": [
    "neptune-graph:CancelQuery",
    "neptune-graph:GetGraphSummary",
    "neptune-graph:ReadDataViaQuery"
  ],
  "Resource": [
    "arn:[AWS_PARTITION]:neptune-graph:[AWS_REGION]:[AWS_ACCOUNT_ID]:graph/[NEPTUNE_GRAPH_RESOURCE_ID]"
  ]
}
```
