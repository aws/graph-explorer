---
title: "Connecting to Neptune"
---

[← Guides](./)

# Connecting to Neptune

Graph Explorer connects to Amazon Neptune through its proxy server, which forwards requests to the database and handles SigV4 signing when IAM authentication is enabled.

## Connection Settings

- Name: `My Neptune Cluster`
- Query Language: Choose the query language for your graph
- Public or Proxy Endpoint: `https://localhost` (or wherever Graph Explorer is hosted)
- Using Proxy Server: `true`
- Graph Connection URL: `https://{your-cluster-endpoint}:8182`
- AWS IAM Auth Enabled: `true` if IAM authentication is enabled on your cluster
- Service Type: `neptune-db` (or `neptune-graph` for Neptune Analytics)
- AWS Region: your cluster's region (e.g., `us-east-1`)

When IAM authentication is enabled, AWS credentials must be available where Graph Explorer's proxy server runs (environment variables, credential file, or IAM role). Read query privileges are needed (see [ReadDataViaQuery managed policy](https://docs.aws.amazon.com/neptune/latest/userguide/iam-data-access-examples.html#iam-auth-data-policy-example-read-query)).

For details on how credentials are resolved, see the [AWS credential provider chain documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-credential-providers/).

## Network Access

### Public Endpoints

Neptune [public endpoints](https://docs.aws.amazon.com/neptune/latest/userguide/neptune-public-endpoints.html) allow Graph Explorer to connect from outside the VPC — including from your local machine. This requires:

- Neptune engine version 1.4.6.x or later
- Public accessibility enabled on the Neptune instance
- IAM database authentication enabled on the cluster (required for public endpoints)
- Security group allowing inbound traffic on port 8182 from Graph Explorer's IP

### VPC Access

For Neptune instances without public endpoints, Graph Explorer must be deployed within the same VPC or connected via VPC peering. See the deployment guides:

- [Deploy to Amazon EC2](./deploy-to-ec2.md)
- [Deploy to ECS Fargate](./deploy-to-ecs-fargate.md)
- [Deploy to SageMaker](./deploy-to-sagemaker.md)
