# Permissions

Graph Explorer does not provide any mechanisms for controlling user permissions. If you are using Graph Explorer with AWS, Neptune permissions can be controlled through IAM roles.

For information about what permissions Graph Explorer requires check out the documentation on [SageMaker configuration](../guides/deploy-to-sagemaker.md#minimum-database-permissions).

<!-- prettier-ignore -->
> [!CAUTION] 
> 
> By default, a Neptune Notebook will have full read & write access to Neptune data.
