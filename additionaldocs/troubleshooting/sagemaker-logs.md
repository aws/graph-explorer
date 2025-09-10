# SageMaker Logs

This guide covers how to gather and troubleshoot logs when running Graph
Explorer on Amazon SageMaker.

## Gathering SageMaker Logs

The Graph Explorer proxy server outputs log statements to standard out. By
default, these logs will be forwarded to CloudWatch if the Notebook has the
proper permissions.

To gather these logs:

1. Open the AWS Console
2. Navigate to the Neptune page
3. Select "Notebook" from the sidebar
4. Find the Notebook hosting Graph Explorer
5. Open the details screen for that Notebook
6. In the "Actions" menu, choose "View Details in SageMaker"
7. Press the "View Logs" link in the SageMaker details screen under the field
   titled "Lifecycle configuration"
8. Scroll down to the "Log Streams" panel in the CloudWatch details where you
   should find multiple log streams
9. For each log stream related to Graph Explorer (LifecycleConfigOnStart.log,
   graph-explorer.log)
   1. Open the log stream
   2. In the "Actions" menu, choose "Download search results (CSV)"

## Graph Explorer Log Stream Does Not Exist

New Neptune Notebooks automatically apply the correct IAM permissions to write
to CloudWatch. If your Notebook does not automatically create a
graph-explorer.log in the CloudWatch Log Streams, then it is possible that the
Neptune Notebook was created before those IAM permissions were added. You'll
need to add those permissions manually.

Below are examples of which IAM permissions you need for Graph Explorer.

- [IAM permissions for Neptune DB](https://raw.githubusercontent.com/aws/graph-explorer/main/additionaldocs/deployment/aws-sagemaker/graph-explorer-neptune-db-policy.json)
- [IAM permissions for Neptune Analytics](https://raw.githubusercontent.com/aws/graph-explorer/main/additionaldocs/deployment/aws-sagemaker/graph-explorer-neptune-analytics-policy.json)
