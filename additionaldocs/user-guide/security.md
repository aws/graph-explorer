# Security

This guide covers security considerations, authentication methods, and
permissions when using Graph Explorer with graph databases.

## Security

You can use Graph Explorer to connect to a publicly accessible graph database
endpoint, or connect to a proxy endpoint that redirects to a private graph
database endpoint.

Graph Explorer supports the HTTPS protocol by default and provides a self-signed
certificate as part of the Docker image. You can choose to use HTTP instead by
changing the
[environment variable default settings](../deployment/configuration.md).

### HTTPS Connections

If either Graph Explorer or the proxy-server are served over an HTTPS connection
(which it is by default), you will have to bypass the warning message from the
browser due to the included certificate being a self-signed certificate. You can
bypass by manually ignoring them from the browser or downloading the correct
certificate and configuring them to be trusted. Alternatively, you can provide
your own certificate. The following instructions can be used as an example to
bypass the warnings for Chrome, but note that different browsers and operating
systems will have slightly different steps.

1. Download the certificate directly from the browser. For example, if using
   Google Chrome, click the "Not Secure" section on the left of the URL bar and
   select "Certificate is not valid" to show the certificate. Then click Details
   tab and click Export at the bottom.
2. Once you have the certificate, you will need to trust it on your machine. For
   MacOS, you can open the Keychain Access app. Select System under System
   Keychains. Then go to File > Import Items... and import the certificate you
   downloaded in the previous step.
3. Once imported, select the certificate and right-click to select "Get Info".
   Expand the Trust section, and change the value of "When using this
   certificate" to "Always Trust".
4. You should now refresh the browser and see that you can proceed to open the
   application. For Chrome, the application will remain "Not Secure" due to the
   fact that this is a self-signed certificate. If you have trouble accessing
   Graph Explorer after completing the previous step and reloading the browser,
   consider running a docker restart command and refreshing the browser again.

<!-- prettier-ignore -->
> [!TIP] 
> 
> To get rid of the "Not Secure" warning, see
[Using self-signed certificates on Chrome](../development/development-setup.md#using-self-signed-certificates-on-chrome).

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
