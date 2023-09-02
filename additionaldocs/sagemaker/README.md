## Launching Graph Explorer using Amazon SageMaker

Graph Explorer can be hosted and launched on Amazon SageMaker Notebooks via a lifecycle configuration script. To learn more about lifecycle configurations and how to create one, see the [documentation](https://docs.aws.amazon.com/sagemaker/latest/dg/notebook-lifecycle-config.html).

You can use the sample lifecycle configuration in this folder, [`install-graph-explorer-lc.sh`](install-graph-explorer-lc.sh), or create your own shell script. 

After you have created the lifecycle configuration, you can apply it to a new or existing SageMaker notebook instance, under `Noteboook instance settings` -> `Additional configuration` -> `Lifecycle configuration`.

