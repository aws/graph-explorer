# Connections UI

You can create and manage connections to graph databases using this feature.
Connections is accessible as the first screen after deploying the application,
when you click `Open Connections` on the top-right. Click `+` on the top-right
to add a new connection. You can also edit and delete connections.

## Add a new connection

- **Name:** Enter a name for your connection (e.g., `MyNeptuneCluster`).
- **Graph Type:** Choose a graph data model that corresponds to your graph
  database.
- **Public or proxy endpoint:** Provide the publicly accessible endpoint URL for
  a graph database, e.g., Gremlin Server. If connecting to Amazon Neptune, then
  provide a proxy endpoint URL that is accessible from outside the VPC, e.g.,
  EC2.
  - **Note:** For connecting to Amazon Neptune, ensure that the graph connection
    URL is in the format `https://[NEPTUNE_ENDPOINT]:8182`, and that the proxy
    endpoint URL is either `https://[EC2_PUBLIC_HOSTNAME]:443` or
    `http://[EC2_PUBLIC_HOSTNAME]:80`, depending on the protocol used. Ensure
    that you don't end either of the URLs with `/`.
- **Using proxy server:** Check this box if using a proxy endpoint.
- **Graph connection URL:** Provide the endpoint for the graph database
- **AWS IAM Auth Enabled:** Check this box if connecting to Amazon Neptune using
  IAM Auth and SigV4 signed requests
- **Service Type:** Choose the service type
- **AWS Region:** Specify the AWS region where the Neptune cluster is hosted
  (e.g., us-east-1)
- **Fetch Timeout:** Specify the timeout for the fetch request
- **Neighbor Expansion Limit:** Specify the default limit for neighbor
  expansion. This will override the app setting for neighbor expansion.

## Available Connections

Once a connection is created, this section will appear as a left-hand pane. When
you create more than one connection to a graph database, you can only connect to
and visualize from one graph database endpoint at a time. To select the active
database, toggle the "Active" switch.

## Connection Details

Once a connection is created, this section will appear as a right-hand
information pane for a selected connection. It shows details such as the
connection name, graph data model type, endpoint and a summary of the graph
data, such as the count of nodes, edges, and a list of node types.

## Last Synchronization

When a connection is created, Graph Explorer will perform a scan of the graph to
provide summary data. To re-synchronize after data has changed on your graph,
select a connection, and then click the "refresh" button next to "Last
Synchronization" text.

## Data Explorer UI

Under a listed node type, you can click on the '>' arrow to get to the "Data
Explorer" view. This allows you to see a sample list of nodes under this type
and choose one or more nodes to "Send to Explorer" for getting started quickly
if you are new to the data.
