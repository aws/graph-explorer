# Launching Graph Explorer using Amazon SageMaker

Graph Explorer can be hosted and launched on Amazon SageMaker Notebooks via a
lifecycle configuration script. To learn more about lifecycle configurations and
how to create one, see the
[documentation](https://docs.aws.amazon.com/sagemaker/latest/dg/notebook-lifecycle-config.html).

You can use the provided sample lifecycle configuration,
[`install-graph-explorer-lc.sh`](install-graph-explorer-lc.sh), or create your
own shell script. If using the sample lifecycle, you should also create an IAM
role with a policy containing the permissions described in either
[`graph-explorer-neptune-db-policy.json`](graph-explorer-neptune-db-policy.json)
or
[`graph-explorer-neptune-analytics-policy.json`](graph-explorer-neptune-analytics-policy.json),
depending on the service used.

After you have created the lifecycle configuration and IAM role, you can attach
them to a new or existing SageMaker notebook instance, under
`Notebook instance settings` -> `Additional configuration` ->
`Lifecycle configuration` and `Permission and encryption` -> `IAM role`,
respectively.

When the notebook has been started and is in "Ready" state, you can access Graph
Explorer by adding the `/proxy/9250/explorer/` extension to the base notebook
URL. The Graph Explorer link should look something like:

```
https://graph-explorer-notebook-name.notebook.us-west-2.sagemaker.aws/proxy/9250/explorer/
```

## Minimum Database Permissions

By default, the permission policy for the IAM role of the SageMaker instance
will have full access to the Neptune Database or Neptune Analytics instance. This means
queries executed within Graph Explorer could contain mutations.

To restrict Graph Explorer access for its most basic functionality you can use
these minimum permissions.

- Read data via queries
- Get the graph summary information (used for schema sync)
- Cancel query

<!-- prettier-ignore -->
> [!CAUTION
] 
> 
> If you are using the standard notebook setup, these policies will apply to both the Jupyter graph notebooks as well as Graph Explorer.

If a user attempts to execute a mutation query inside of Graph Explorer, they
will be presented with an error that informs them they are not authorized for
that request.

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
