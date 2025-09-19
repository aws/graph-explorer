# Security

This guide covers authentication methods and permissions when using Graph
Explorer with graph databases.

For HTTPS configuration and certificate setup, see the
[HTTPS Setup](../deployment/https-setup.md) guide.

## Permissions

Graph Explorer does not provide any mechanisms for controlling user permissions.
If you are using Graph Explorer with AWS, Neptune permissions can be controlled
through IAM roles.

For information about what permissions Graph Explorer requires check out the
documentation on
[SageMaker configuration](../deployment/aws-sagemaker.md#minimum-database-permissions).

<!-- prettier-ignore -->
> [!CAUTION] 
> 
> By default, a Neptune Notebook will have full read & write access to Neptune data.

## Authentication

Authentication for Amazon Neptune connections is enabled using the
[SigV4 signing protocol](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html).

To use AWS IAM authentication, you must run requests through a proxy endpoint,
such as an EC2 instance, where credentials are resolved and where requests are
signed.

To set up a connection in Graph Explorer UI with AWS IAM auth enabled on
Neptune, check Using Proxy-Server, then check AWS IAM Auth Enabled and type in
the AWS Region where the Neptune cluster is hosted (e.g., us-east-1).

For further information on how AWS credentials are resolved in Graph Explorer,
refer to this
[documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html).
