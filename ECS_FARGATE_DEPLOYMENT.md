# How to run graph-explorer in Amazon ECS on AWS Fargate and connect to Neptune

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
     * From the navigation bar, select the Region to use.
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

  After the request is processed, the console returns you to your certificate list, where information about the new certificate is displayed.
5.
6. **Creating a task definition**
      * Open the console at https://console.aws.amazon.com/ecs/v2.
      * In the navigation pane, choose Task definitions.
      * Choose Create new task definition, Create new task definition with JSON.
      * In the JSON editor box, edit your JSON file,
      * The JSON must pass the validation checks specified in JSON validation.
      * Choose Create.
    
