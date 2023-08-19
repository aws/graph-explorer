# How to run graph-explorer on AWS Fargate in Amazon ECS and connect to Neptune
The following steps let you set up graph-explorer on Fargate in Amazon ECS and connect to a running Neptune database.

1. **Create a new IAM role and attach these policies to it**
    * Open the IAM console at https://console.aws.amazon.com/iam/.
    * In the navigation pane, choose Roles, and then choose Create role.
    * Choose the AWS service role type, and then under Use cases for other AWS services, choose Elastic Container Service.
    * Choose the Elastic Container Service Task use case, and then choose Next: Permissions.
    * In the Permissions policies section, verify the [AmazonECSTaskExecutionRolePolicy](https://console.aws.amazon.com/iam/home#/policies/arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy) and [CloudWatchLogsFullAccess](https://console.aws.amazon.com/iam/home#/policies/arn:aws:iam::aws:policy/CloudWatchLogsFullAccess) policy is selected, and then choose Next.
    * For Role name, enter `GraphExplorer_ECS_Role` and optionally you can enter a description.
    * For Add tags (optional), enter any custom tags to associate with the policy, and then choose Next: Review.
    * Review your role information and then choose Create role to finish.
      ![image](https://github.com/StrongPa55w0rd/graph-explorer/assets/356327/16b6cbcf-6898-47c4-8de2-403b977ffe50)

    Keep the role name handy to use in a minute.

2. **Create an Amazon ECS Cluster**
     * Open the console at https://console.aws.amazon.com/ecs/v2.
     * From the navigation ba
     * In the navigation pane, choose Clusters.
     * On the Clusters page, choose Create cluster.
     * Under Cluster configuration, for Cluster name, enter a unique name.
     * The name can contain up to 255 letters (uppercase and lowercase), numbers, and hyphens.
     * (Optional) To change the name of the default namespace. for Namespace, enter a unique name.
     * VPC: set to the VPC where your Neptune database is located.
     * Subnets: set to the public subnets of that VPC (remove all others).
     * (Optional) To turn on Container Insights, expand Monitoring, and then turn on Use Container Insights.
     * (Optional) To help identify your cluster, expand Tags, and then configure your tags.
     * [Add a tag] Choose Add tag and do the following:
       * For Key, enter the key name.
       * For Value, enter the key value.
     * Choose create
     ![image](https://github.com/StrongPa55w0rd/graph-explorer/assets/356327/901e9e2a-fdda-4a02-9f73-32ee9e7e61ca)
After you create the cluster you can create task definitions for your applicants, and then run them as standalone tasks, or part of a service.

3. **Request an ACM Public certificate**
      * Sign in to the AWS Management Console and open the ACM console at https://console.aws.amazon.com/acm/home.
      * Choose Request a certificate.
      * In the Domain names section, type your domain name.
      * You can use a fully qualified domain name (FQDN), such as `graphexplorer.example.com`, or a bare or apex domain name such as `example.com`. You can also use an asterisk (*) as a wild card in the leftmost position to protect several site names in the same domain.
      * In the Validation method section, choose either DNS validation – `recommended` or Email validation, depending on your needs.
        * Before ACM issues a certificate, it validates that you own or control the domain names in your certificate request.
        * If you choose email validation, ACM sends validation email to three contact addresses registered in the WHOIS database, and up to five common system administration addresses for each domain name. You or an authorized representative must reply to one of these email messages. For more information, see [Email validation](https://docs.aws.amazon.com/acm/latest/userguide/email-validation.html).
        * If you use DNS validation, you simply add a CNAME record provided by ACM to your DNS configuration. For more information about DNS validation, see [DNS validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html).
      * In the Key algorithm section, chose one of the three available algorithms:
        * RSA 2048 (default)
        * ECDSA P 256
        * ECDSA P 384
      * In the Tags page, you can optionally tag your certificate.
      * When you finish adding tags, choose Request.
  
   After the request is processed, the console returns you to your certificate list, where information about the new certificate is displayed. A certificate enters status     Pending validation upon being requested, and once the verification is successful, ACM will issue the SSL/TLS certificate for the specified domain names.

4. **Creating a ECS Task Definition**
      * Open the console at https://console.aws.amazon.com/ecs/v2.
      * In the navigation pane, choose Task definitions.
      * Choose Create new task definition, Create new task definition with JSON.
      * In the JSON editor box, edit your JSON file as follows.
  
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
Update the `region,taskRoleArn,executionRoleArn,GRAPH_CONNECTION_URL,PUBLIC_OR_PROXY_ENDPOINT`.


5. **Create a Fargate Service**
   
      * Open the console at https://console.aws.amazon.com/ecs/v2.
      * In the navigation page, choose Clusters.
      * On the Clusters page, select the cluster that was created in Step 2.
      * From the Services tab, choose Create.
      * Expand Compute configuration, and then choose Launch type `Fargate` and Platform Version `Latest`.
      * To specify how your service is deployed, expand Deployment configuration, and then For Application type, choose `Service`.
      * For Task definition, choose the task definition created in step4 and select latest revision.
      * For Service name, enter a name for your service `svc-graphexplorer-demo`.
      * For Service type, choose `Replica`.
      * For Desired tasks, enter the number of tasks to launch and maintain in the service.
      * Expand the Network Configuration and select the VPC where your Neptune database is located.
      * For Subnets, set to the public subnets of that VPC (remove all others).
      * For Security Group, create a new security group and specify a security group name `graphexplorer-demo`, description `Security group for access to graph-explorer`, port `80` and `443` and authorize only a specific IP address range to access your instances.
      * Expand Loadbalancing and select Application loadbalancer and create new loadbalancer with below configuration (see screenshot below).
          * Loadbalancer Name : `lb-graph-explorer-demo`
          * Choose container to load balance : graph-explorer 443:443.
          * Create New listener with  Port 443 / Protocol HTTPS.
          * Choose from ACM certificate created in Step 3.
          * Create new target group `tg-graphexplorer-demo` with Protocol `HTTPS` and Health Check Path `/explorer/` with Health check protocol `HTTPS`.

      <img width="720" alt="image" src="https://github.com/StrongPa55w0rd/graph-explorer/assets/356327/c6961dff-c87c-403a-b3b0-52be42564a54">
     
      * (Optional) To configure service auto scaling, expand Service auto scaling, and then specify the desired scaling configuration.
      * (Optional) To help identify your service and tasks, expand the Tags section, and then configure your tags.
      * To have Amazon ECS automatically tag all newly launched tasks with the cluster name and the task definition tags, select Turn on Amazon ECS managed tags, and then select Task definitions.
      * Select create
      
  
      <img width="1723" alt="image" src="https://github.com/StrongPa55w0rd/graph-explorer/assets/356327/7746edbd-cf4d-4532-9a10-cde87e5a55a1">
  After few minutes the service will be created and ready.

6. **Create Amazon Route53 Entry**
      * Open the Route 53 console at https://console.aws.amazon.com/route53/.
      * On the Hosted zones page, choose the name of the hosted zone that you want to create records in.
      * Choose Create record.
      * Enter the domain or subdomain name that you want to use to route traffic to your Application load balancer. For eg. `graphexplorer.example.com`.
      * Choose Alias to Application and Classic Load Balancer and then choose the Region that the endpoint is from.
      * Choose the name that you assigned to the load balancer when you created the ECS Fargate Service.
      * Leave everything else default and Choose Create records.

Changes generally propagate to all Route 53 servers within 60 seconds. When propagation is done, you'll be able to route traffic to your load balancer by using the name of the alias record that you created in the above step.

Now, enter the URL you created in the previous step into a browser to access the endpoint for the Graph Explorer for eg.`https://graphexplorer.example.com/explorer`. You should now be connected.

