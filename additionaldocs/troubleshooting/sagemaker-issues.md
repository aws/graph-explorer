# SageMaker Issues

This guide covers common issues and troubleshooting steps when running Graph
Explorer on Amazon SageMaker.

## Graph Explorer Log Stream Does Not Exist

New Neptune Notebooks automatically apply the correct IAM permissions to write
to CloudWatch. If your Notebook does not automatically create a
graph-explorer.log in the CloudWatch Log Streams, then it is possible that the
Neptune Notebook was created before those IAM permissions were added. You'll
need to add those permissions manually.

Below are examples of which IAM permissions you need for Graph Explorer.

- [IAM permissions for Neptune DB](https://raw.githubusercontent.com/aws/graph-explorer/main/additionaldocs/deployment/aws-sagemaker/graph-explorer-neptune-db-policy.json)
- [IAM permissions for Neptune Analytics](https://raw.githubusercontent.com/aws/graph-explorer/main/additionaldocs/deployment/aws-sagemaker/graph-explorer-neptune-analytics-policy.json)
