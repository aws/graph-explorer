[← Guides](../)

# Sample IAM Policies

When a Connection has IAM authentication turned on, the Graph Explorer proxy server signs its requests with the AWS identity of its host, such as an ECS task role or an EC2 instance profile. That identity needs a Neptune data-access policy, or Neptune refuses every signed request. These samples give you a starting point for that policy.

> [!IMPORTANT]
>
> These policies are examples, not a recommended production configuration. Review them against your own security requirements before you attach one.

## Choose a policy

- **Read-only** runs read queries and reads the graph summary, which schema sync uses. For Neptune Database, it also allows query cancellation, so when Graph Explorer stops waiting for a Gremlin or SPARQL query, such as when you close the tab, the query stops on the database too.
  - [Neptune Database](./neptune-db-read-only.json)
  - [Neptune Analytics](./neptune-analytics-read-only.json)
- **Read-write** adds writing and deleting data to the read-only policy, so queries in the query editor can change the graph.
  - [Neptune Database](./neptune-db-read-write.json)
  - [Neptune Analytics](./neptune-analytics-read-write.json)

Graph Explorer has no built-in authentication, and every user of a deployment shares the proxy server's identity. With the read-write policy, anyone who can reach the deployment can change or delete data in the database. See [Permissions](../../references/security.md#permissions).

The Neptune Analytics samples leave out query cancellation because Graph Explorer never cancels a Neptune Analytics query.

For the actions in each policy, see [IAM actions for data access](https://docs.aws.amazon.com/neptune/latest/userguide/iam-dp-actions.html) and the [read-only policy example](https://docs.aws.amazon.com/neptune/latest/userguide/iam-data-access-examples.html#iam-auth-data-policy-example-read-query) in the Neptune User Guide.

## Placeholders

Replace each placeholder in square brackets before you attach the policy.

- `[AWS_PARTITION]`: `aws` for most regions
- `[AWS_REGION]`: the region of your database
- `[AWS_ACCOUNT_ID]`: the account that owns your database
- `[NEPTUNE_CLUSTER_RESOURCE_ID]`: the cluster resource ID of your Neptune cluster, shown on its **Configuration** tab and starting with `cluster-`. This is not the cluster identifier.
- `[NEPTUNE_GRAPH_RESOURCE_ID]`: the graph identifier of your Neptune Analytics graph, starting with `g-`

## Resource scope

Each sample names a single database in `Resource`. To let the deployment reach another database, add its ARN rather than widening the ARN with wildcards.

The `/*` at the end of the Neptune Database ARN is part of the format Neptune requires for data-access resources, `arn:aws:neptune-db:{region}:{account-id}:{cluster-resource-id}/*`. It covers the data in the one cluster that the resource ID names, not other clusters. See [IAM resource types for accessing data](https://docs.aws.amazon.com/neptune/latest/userguide/iam-data-resources.html).

## SageMaker notebooks

The sample policies for SageMaker notebooks are separate and grant every database action, because the notebook role is shared with other tools on the instance. See [Minimum Database Permissions](../deploy-to-sagemaker.md#minimum-database-permissions).
