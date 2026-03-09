# Connecting to Neptune

- Ensure that Graph Explorer has access to the Neptune instance by being in the same VPC or VPC peering.
- If authentication is enabled, read query privileges are needed (See [ReadDataViaQuery managed policy](https://docs.aws.amazon.com/neptune/latest/userguide/iam-data-access-examples.html#iam-auth-data-policy-example-read-query)).

## Authentication

Authentication for Amazon Neptune connections is enabled using the [SigV4 signing protocol](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html).

To use AWS IAM authentication, you must run requests through a proxy endpoint, such as an EC2 instance, where credentials are resolved and where requests are signed.

To set up a connection in Graph Explorer UI with AWS IAM auth enabled on Neptune, check Using Proxy-Server, then check AWS IAM Auth Enabled and type in the AWS Region where the Neptune cluster is hosted (e.g., us-east-1).

For further information on how AWS credentials are resolved in Graph Explorer, refer to this [documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html).
