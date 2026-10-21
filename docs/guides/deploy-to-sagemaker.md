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

On SageMaker, the notebook's Jupyter proxy is that access control layer. See [Security model](#security-model).

## Network Requirements

Graph Explorer routes database requests through the proxy server running on the SageMaker notebook instance. This means the instance must have network access to any database you want to explore.

If your notebook instance is in a private subnet without a NAT gateway or internet gateway, it will not be able to reach databases outside the VPC. To connect to external databases, ensure the instance has the appropriate network routing (VPC peering, NAT gateway, transit gateway, etc.).

With the sample lifecycle script, routing alone isn't enough. The script sets `PROXY_SERVER_ALLOWED_DB_ORIGINS` so the proxy server connects only to the Neptune endpoint you configured. To reach another database, add its origin to `ALLOWED_DB_ORIGINS` in the script, after a comma and with no spaces, such as `https://{NEPTUNE_ENDPOINT}:8182,https://{OTHER_ENDPOINT}:8182`. The change takes effect the next time the notebook instance starts. A "not in the Database Origin Allowlist" error means the origin is missing from that list or doesn't match the scheme, host, and port of the URL in your Connection. See [Database Origin Allowlist](../references/security.md#database-origin-allowlist).

## Security model

The notebook environment provides the protections that let the sample lifecycle script serve Graph Explorer over plain HTTP:

- Jupyter terminates TLS, so browser traffic to the notebook is encrypted.
- Jupyter requires a signed-in AWS principal, so only authenticated users reach the proxy.
- The container listens on port `9250` and the Jupyter proxy reaches it over loopback.

The Jupyter proxy at `/proxy/9250/explorer/` is the only intended access path. Do not expose port `9250` any other way.

None of these properties travel with the settings. `PROXY_SERVER_HTTPS_CONNECTION=false` is safe here because of what surrounds the container. Copying it to another environment serves unauthenticated, unencrypted traffic.

## Logging and privacy

The sample lifecycle script sets `LOG_LEVEL=info`, which keeps database query text out of the logs. If you raise it to `debug` and **Enable database query logging on proxy server** is turned on in **Settings** > **General**, query text is written to the CloudWatch log group `/aws/sagemaker/NotebookInstances`, which is shared with the notebook. Anyone who can read that log group can read the queries.

## Minimum Database Permissions

By default, the permission policy for the IAM role of the SageMaker instance will have full access to the Neptune Database or Neptune Analytics instance. This means queries executed within Graph Explorer could contain mutations.

The sample policies grant every database action (`neptune-db:*` or `neptune-graph:*`) because the role is shared by everything on the notebook instance, including the Jupyter graph notebooks, which use more actions than Graph Explorer, such as bulk loading and engine status. If you don't need those notebook features, narrow the role as described below.

To narrow the role, replace the statement with `"Action": "neptune-db:*"` or `"Action": "neptune-graph:*"` in the sample policy with the single entry in the `Statement` array of the matching read-only sample, [Neptune Database](./iam-policies/neptune-db-read-only.json) or [Neptune Analytics](./iam-policies/neptune-analytics-read-only.json). Keep the SageMaker and CloudWatch Logs statements, which the notebook instance needs. The read-only samples grant read queries and the graph summary, plus query cancellation.

> [!CAUTION]
>
> If you are using the standard notebook setup, these policies will apply to both the Jupyter graph notebooks as well as Graph Explorer.

If a user attempts to execute a mutation query inside of Graph Explorer, they will be presented with an error that informs them they are not authorized for that request.
