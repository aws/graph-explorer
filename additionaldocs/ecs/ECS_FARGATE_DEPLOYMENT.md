# Running Graph Explorer on AWS Fargate + Amazon ECS

The following steps will allow you set up Graph Explorer on AWS Fargate in Amazon ECS, and connect to a running Neptune database.

### Create a new IAM role and permission policies
1. Open the IAM console at https://console.aws.amazon.com/iam/.
2. In the navigation pane, click **Roles**, and then click **Create role**.
3. Choose **AWS service** as the role type. Under **Use cases for other AWS services**, choose **Elastic Container Service** in the dropdown, then select the **Elastic Container Service Task** option.
4. Click **Next**.
5. Under **Permissions policies**, search for and select the AWS managed policies [AmazonECSTaskExecutionRolePolicy](https://console.aws.amazon.com/iam/home#/policies/arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy) and [CloudWatchLogsFullAccess](https://console.aws.amazon.com/iam/home#/policies/arn:aws:iam::aws:policy/CloudWatchLogsFullAccess).
6. Click **Next**.
7. For **Role name**, set the value to `GraphExplorer_ECS_Role`. Optionally, you can enter a description.
8. For **Add tags (optional)**, enter any custom tags to associate with the policy.
9. Click **Create role** to finish, and keep the role name handy to use in the next steps.

![image](https://github.com/StrongPa55w0rd/graph-explorer/assets/356327/16b6cbcf-6898-47c4-8de2-403b977ffe50)

### Create an Amazon ECS Cluster
1. Open the ECS console at https://console.aws.amazon.com/ecs/v2.
2. In the left hand navigation pane, click **Clusters**.
3. On the Clusters page, click **Create cluster**.
4. Under **Cluster configuration**, for **Cluster name**, enter a unique identifier.
   - The name can contain up to 255 letters (uppercase and lowercase), numbers, and hyphens.
   - (Optional) If you would like to use a namespace different from the cluster name, modify the value of **Default namespace**.
5. Under **Infrastructure**, select only **AWS Fargate**.
6. (Optional) To turn on Container Insights, expand **Monitoring**, and then turn on **Use Container Insights**.
7. (Optional) To help identify your cluster, expand **Tags**, and then configure your tags.
     * [Add a tag] Choose **Add tag and** do the following:
       * For **Key**, enter the key name.
       * For **Value**, enter the key value.
8. Click **Create**.

After the cluster has finished creation, you can create task definitions for your applications, which can then be run as standalone tasks, or as part of a service.

![image](https://github.com/StrongPa55w0rd/graph-explorer/assets/356327/901e9e2a-fdda-4a02-9f73-32ee9e7e61ca)

### Request an ACM Public Certificate
1. Open the ACM console at https://console.aws.amazon.com/acm/home.
2. In the left hand navigation pane, click **Request certificate**.
3. Under **Certificate type**, choose **Request a public certificate**.
4. Click **Next**.
5. In the **Domain names** section, enter your desired domain name.
   - You can use a fully qualified domain name (FQDN), such as `graphexplorer.example.com`, or a bare or apex domain name such as `example.com`. You can also use an asterisk (*) as a wild card in the leftmost position to protect several site names in the same domain.
6. In the **Validation method** section, choose either **DNS validation – `recommended`** or **Email validation**, depending on your needs.
   - Before ACM issues a certificate, it validates that you own or control the domain names in your certificate request.
   - If you choose **email validation**, ACM sends validation email to three contact addresses registered in the WHOIS database, and up to five common system administration addresses for each domain name. You or an authorized representative must reply to one of these email messages. For more information, see [Email validation](https://docs.aws.amazon.com/acm/latest/userguide/email-validation.html).
   - If you use **DNS validation**, you simply add a CNAME record provided by ACM to your DNS configuration. For more information about DNS validation, see [DNS validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html).
7. In the **Key algorithm** section, choose one of the three available algorithms:
   - RSA 2048 (default)
   - ECDSA P 256
   - ECDSA P 384
8. (Optional) Under the **Tags** section, you can add tags for your certificate.
9. Click **Request**.
  
After the request is processed, the console will return you to your certificate list, where information about the certificate will be displayed. The newly requested certificate will initially display the status `Pending validation`. Once the verification is successful, ACM will issue the SSL/TLS certificate for the specified domain names.

### Creating an ECS Task Definition
1. Open the ECS console at https://console.aws.amazon.com/ecs/v2.
2. In the left hand navigation pane, choose **Task definitions**.
3. Click **Create new task definition** -> **Create new task definition with JSON**.
4. In the JSON editor box, copy in the following template.
      ```json
      {
          "family": "graph-explorer",
          "containerDefinitions": [
              {
                  "name": "graph-explorer",
                  "image": "public.ecr.aws/neptune/graph-explorer:latest",
                  "cpu": 0,
                  "portMappings": [
                      {
                          "name": "graph-explorer-80-tcp",
                          "containerPort": 80,
                          "hostPort": 80,
                          "protocol": "tcp",
                          "appProtocol": "http"
                      },
                      {
                          "name": "graph-explorer-443-tcp",
                          "containerPort": 443,
                          "hostPort": 443,
                          "protocol": "tcp",
                          "appProtocol": "http"
                      }
                  ],
                  "essential": true,
                  "environment": [
                      {
                          "name": "AWS_REGION",
                          "value": "us-west-2"
                      },
                      {
                          "name": "GRAPH_TYPE",
                          "value": "gremlin"
                      },
                      {
                          "name": "GRAPH_EXP_HTTPS_CONNECTION",
                          "value": "true"
                      },
                      {
                          "name": "IAM",
                          "value": "false"
                      },
                      {
                          "name": "USING_PROXY_SERVER",
                          "value": "true"
                      },
                      {
                          "name": "PUBLIC_OR_PROXY_ENDPOINT",
                          "value": "https://{FQDN_from_step3}"
                      },
                      {
                          "name": "HOST",
                          "value": "localhost"
                      },
                      {
                          "name": "SERVICE_TYPE",
                          "value": "neptune-db"
                      },
                      {
                          "name": "GRAPH_CONNECTION_URL",
                          "value": "https://{NEPTUNE_ENDPOINT}:8182"
                      },
                      {
                          "name": "PROXY_SERVER_HTTPS_CONNECTION",
                          "value": "true"
                      }
                  ],
                  "mountPoints": [],
                  "volumesFrom": [],
                  "logConfiguration": {
                      "logDriver": "awslogs",
                      "options": {
                          "awslogs-create-group": "true",
                          "awslogs-group": "/ecs/graph-explorer",
                          "awslogs-region": "{REGION}",
                          "awslogs-stream-prefix": "ecs"
                      }
                  }
              }
          ],
          "taskRoleArn": "arn:aws:iam::{account_no}:role/{role_name_from_step_1}",
          "executionRoleArn": "arn:aws:iam::{account_no}:role/{role_name_from_step_1}",
          "networkMode": "awsvpc",
          "requiresCompatibilities": [
              "FARGATE"
          ],
          "cpu": "1024",
          "memory": "3072",
          "runtimePlatform": {
              "cpuArchitecture": "X86_64",
              "operatingSystemFamily": "LINUX"
          }
      }
      ```
5. In the JSON template, update the following fields:
   - `taskRoleArn` and `executionRoleArn`: The ARN of the IAM role created in step "Create a new IAM role and permission policies".
   - `environment` variables section (see [Default Connections](https://github.com/aws/graph-explorer#providing-a-default-connection) for more details):
     - `AWS_REGION`: The AWS region in which your Neptune cluster is located.
     - `GRAPH_TYPE`: The query language for your initial connection.
     - `IAM`: Set this to `true` to use SigV4 signed requests, if your Neptune cluster has IAM db authentication enabled.
     - `GRAPH_CONNECTION_URL`: Set this as `https://{NEPTUNE_ENDPOINT}:8182`.
     - `PUBLIC_OR_PROXY_ENDPOINT`: Set this as `https://{Domain name set in Step 5 of "Request an ACM Public Certificate"}`.
     - `SERVICE_TYPE`:  Set this as `neptune-db` for Neptune database or `neptune-graph` for Neptune Analytics.
6. Click **Create**.

### Create a Fargate Service
1. Open the ECS console at https://console.aws.amazon.com/ecs/v2.
2. In the left hand navigation pane, choose **Clusters**.
3. On the Clusters page, select the cluster that was created in step "Create the Amazon ECS Cluster".
4. Under the **Services** tab, click **Create**.
5. Under the **Environment** section, expand **Compute configuration** and configure the options with the values:
   - **Compute options**: `Launch type`
   - **Launch type**: `FARGATE`
   - **Platform Version**: `LATEST`
6. Under the **Deployment configuration** section, set the following:
   - **Application type**: Choose **Task**.
   - **Task definition**: Choose the task definition created in step "Creating an ECS Task Definition", and select the latest revision.
   - **Service name**: Enter a name for your service, ex. `svc-graphexplorer-demo`.
   - **Service type**: Choose **Replica**.
   - **Desired tasks**: Enter the number of tasks to launch and maintain in the service.
7. Expand the **Networking** section, and set the following:
   - **VPC**: Select the VPC where your Neptune database is located.
   - **Subnets**: Select all of the public subnets for that VPC, and remove any unassociated subnets.
   - **Security group**: Select **Create a new security group**, and set the fields as:
     - **Security group name**: `graphexplorer-demo`
     - **Security group description**: `Security group for access to graph-explorer`
     - **Inbound rules**: Add two rules, one with type `HTTPS` and port range `443`, and the second with type `HTTP` and port range `80`. Preferably, authorize only a specific IP address range to access your instances.
8. Expand the **Load balancing** section.
9. Select **Application load balancer**, and create a new load balancer with the configuration:
   - **Load balancer name**: `lb-graph-explorer-demo`
   - **Choose container to load balance**: `graph-explorer 443:443`.
   - **Listener**: Select **Create New listener**, then set **Port** as `443` and **Protocol** as `HTTPS`.
   - **Certificate**: Select **Choose from ACM certificates**, then select the domain name created in step "Request an ACM Public Certificate".
   - **Target group**: Select **Create new target group**, with the options set to:
     - **Target group name**: `tg-graphexplorer-demo` with **Protocol** as `HTTPS`.
     - **Health check path**: `/explorer/` with **Health check protocol** as `HTTPS`.

      <img width="720" alt="image" src="https://github.com/StrongPa55w0rd/graph-explorer/assets/356327/c6961dff-c87c-403a-b3b0-52be42564a54">
     
10. (Optional) Under section **Service auto scaling**, specify the desired scaling configuration.
11. (Optional) To help identify your service and tasks, expand the **Tags** section, then configure your desired tags.
    - **Tip**: To have Amazon ECS automatically tag all newly launched tasks with the cluster name and the task definition tags, select **Turn on Amazon ECS managed tags**, and then select **Task definitions**.
12. Click **Create**. 

After few minutes, the Fargate service will be created and ready.
  
<img width="1723" alt="image" src="https://github.com/StrongPa55w0rd/graph-explorer/assets/356327/7746edbd-cf4d-4532-9a10-cde87e5a55a1">
  

### Create an Amazon Route53 Entry
1. Open the Route 53 console at https://console.aws.amazon.com/route53/.
2. In the left hand navigation pane, click **Hosted zones**.
3. Under **Hosted zones**, click the name of the hosted zone that you want to create records in.
   - If you do not have a hosted zone yet, create one with the **Domain name** as the base for the domain created in section "Request an ACM Public Certificate". For example, if the full domain is `graphexplorer.example.com`, the hosted zone domain name should be `example.com`.
5. Under the **Records** tab, click **Create record**.
6. Under the record displayed in the **Quick create record** section, set the following configuration:
   - **Record name**: Enter the subdomain name that you want to use to route traffic to your Application load balancer. This subdomain in conjunction with the hosted zone domain name should be your full domain as defined for the ACM certificate. For example, if your full domain is `graphexplorer.example.com`, and the hosted zone domain is `example.com`, then the Record name should be `graphexplorer`.
   - **Alias**: Enable this option, and configure in order:
     - **Choose endpoint**: Select `Alias to Application and Classic Load Balancer`.
     - **Choose region**: Select the AWS region that the endpoint is from.
     - **Choose load balancer**: Choose the name that you assigned to the load balancer when you created the ECS Fargate Service.
7. Leave everything else default, and click **Create records**.

Changes generally propagate to all Route 53 servers within 60 seconds. When propagation is done, you'll be able to route traffic to your load balancer by using the name of the alias record that you created in the above step.

### Accessing Graph Explorer

Enter the URL you created in the Route53 section into a browser to access the endpoint for the Graph Explorer (ex.`https://graphexplorer.example.com/explorer`). You should now be connected.

