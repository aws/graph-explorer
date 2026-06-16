[← Features](./)

# Connections

You can create and manage connections to graph databases using this feature. Connections is accessible as the first screen after deploying the application or by clicking `Connections` in the navigation bar. Click `+` on the top-right to add a new connection. You can also edit and delete connections.

For guides on connecting to specific databases, see [Connecting to databases](../guides#connecting-to-databases).

## Add a New Connection

- **Name:** Enter a name for your connection (e.g., `MyNeptuneCluster`).
- **Query Language:** Choose a query language that corresponds to your graph database.
- **Graph Connection URL:** Provide the endpoint URL for your graph database (e.g., `https://[NEPTUNE_ENDPOINT]:8182`). Ensure that the URL does not end with `/`.
- **AWS IAM Auth Enabled:** Check this box if connecting to Amazon Neptune using IAM Auth and SigV4 signed requests.
- **Service Type:** Choose the service type (`neptune-db` or `neptune-graph`).
- **AWS Region:** Specify the AWS region where the Neptune cluster is hosted (e.g., us-east-1).
- **Fetch Timeout:** Specify the timeout for the fetch request.
- **Neighbor Expansion Limit:** Specify the default limit for neighbor expansion. This will override the app setting for neighbor expansion.

## Available Connections

Once a connection is created, this section will appear as a left-hand pane. When you create more than one connection to a graph database, you can only connect to and visualize from one graph database endpoint at a time. To select the active database, toggle the "Active" switch.

The active connection is per browser tab: switching connections in one tab does not change what another open tab is viewing, so you can explore different connections side by side. When you reopen Graph Explorer after closing all tabs, it resumes the connection you most recently used.

## Connection Details

Once a connection is created, this section will appear as a right-hand information pane for a selected connection. It shows details such as the connection name, query language, endpoint and a summary of the graph data, such as the count of nodes, edges, and a list of node types.

### Last Synchronization

When a connection is created, Graph Explorer will perform a scan of the graph to provide summary data. To re-synchronize after data has changed on your graph, select a connection, and then click the "refresh" button next to "Last Synchronization" text.

### Data Table

Under a listed node type, you can click on the ">" arrow to get to the [Data Table](./data-table.md) view. This allows you to see a sample list of nodes under this type and choose one or more nodes to "Send to Explorer" for getting started quickly if you are new to the data. You can also navigate directly to the Data Table view using the "Data Table" link in the navigation bar.
