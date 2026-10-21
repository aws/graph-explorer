[← Guides](../)

# Sample IAM Policies

Sample policies for the AWS identity the Graph Explorer proxy server signs requests with when a Connection has IAM authentication turned on. That identity is an ECS task role, an EC2 instance profile, or a similar role. Without one of these policies, Neptune refuses every signed request.

- [Neptune Database policy](./graph-explorer-neptune-db-policy.json)
- [Neptune Analytics policy](./graph-explorer-neptune-analytics-policy.json)

Each policy grants only the actions Graph Explorer uses: read, write, and delete data via query, cancel query, and get graph summary. It names a single database in `Resource`.

## Placeholders

Replace each placeholder in square brackets before you attach the policy.

- `[AWS_PARTITION]`: `aws` for most regions
- `[AWS_REGION]`: the region of your database
- `[AWS_ACCOUNT_ID]`: the account that owns your database
- `[NEPTUNE_CLUSTER_RESOURCE_ID]`: the cluster resource ID of your Neptune cluster, shown on its **Configuration** tab and starting with `cluster-`
- `[NEPTUNE_GRAPH_RESOURCE_ID]`: the graph identifier of your Neptune Analytics graph, starting with `g-`

To let the deployment reach more than one database, add another ARN to `Resource`.

## Read-only variant

Remove `WriteDataViaQuery` and `DeleteDataViaQuery` from `Action` to make the deployment read-only. Queries that modify data then fail with an authorization error. For an example of a read-only policy, see [the Neptune user guide](https://docs.aws.amazon.com/neptune/latest/userguide/iam-data-access-examples.html#iam-auth-data-policy-example-read-query).

For how this policy fits with other controls, see [Permissions](../../references/security.md#permissions).

The sample policies for SageMaker notebooks are separate. They grant more actions because the role is shared with other tools on the notebook instance. See [Minimum Database Permissions](../deploy-to-sagemaker.md#minimum-database-permissions).
