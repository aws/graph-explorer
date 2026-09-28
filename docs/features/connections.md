[← Features](./)

# Connections

You can create and manage connections to graph databases using this feature. Connections is accessible as the first screen after deploying the application or by clicking `Connections` in the navigation bar. Click `+` on the top-right to add a new connection. You can also edit and delete connections.

For guides on connecting to specific databases, see [Connecting to databases](../guides#connecting-to-databases).

## Add a New Connection

- **Name:** Enter a name for your connection (e.g., `MyNeptuneCluster`).
- **Query Language:** Choose a query language that corresponds to your graph database.
- **Database URL:** Provide the endpoint URL for your graph database (e.g., `https://[NEPTUNE_ENDPOINT]:8182`). Ensure that the URL does not end with `/`.
- **AWS IAM Auth Enabled:** Check this box if connecting to Amazon Neptune using IAM Auth and SigV4 signed requests. Checking it reveals the **AWS Region** and **Service Type** fields.
- **AWS Region:** Specify the AWS region where the Neptune cluster is hosted (e.g., us-east-1).
- **Service Type:** Choose the service type: **Neptune DB** or **Neptune Analytics**.

The next three settings are grouped under an **Advanced options** section that you expand to reach. It starts expanded when the connection you are editing already overrides one of them, so an existing override is never hidden from you.

- **Fetch Timeout:** Check **Enable Fetch Timeout** to reveal **Fetch Timeout (ms)**, then specify the timeout for the fetch request.
- **Neighbor Expansion Limit:** Check **Override Default Neighbor Expansion Limit** to reveal this field, then specify the default limit for neighbor expansion. This will override the app setting for neighbor expansion.
- **Connect directly from the browser (deprecated):** Check this box to have your browser send requests to the database itself instead of through the Graph Explorer server. The database must allow cross-origin requests (CORS) from the Graph Explorer page, and IAM authentication isn't available, so the IAM fields are hidden. When Graph Explorer is served over HTTPS, the browser usually blocks an `http://` Database URL unless it points at a loopback host such as `localhost`; see [Insecure Database URL](../guides/troubleshooting.md#insecure-database-url). A direct connection shows "Direct" in the connection list and "Direct from browser (deprecated)" in its details.

> [!WARNING]
>
> Direct connections are deprecated and will be removed in a future release. Leave **Connect directly from the browser (deprecated)** unchecked unless you depend on it.

## Available Connections

Once a connection is created, this section will appear as a left-hand pane. When you create more than one connection to a graph database, you can only connect to and visualize from one graph database endpoint at a time. To select the active database, click its row in the list.

The active connection is per browser tab: switching connections in one tab does not change what another open tab is viewing, so you can explore different connections side by side. When you reopen Graph Explorer after closing all tabs, it resumes the connection you most recently used.

## Connection Details

Once a connection is created, this section will appear as a right-hand information pane for a selected connection. It shows details such as the connection name, query language, endpoint and a summary of the graph data, such as the count of nodes, edges, and a list of node types.

### Last Synchronization

When a connection is created, Graph Explorer will perform a scan of the graph to provide summary data. To re-synchronize after data has changed on your graph, select a connection, and then click the "refresh" button next to "Last Synchronization" text.

### Data Table

Under a listed node type, you can click on the ">" arrow to get to the [Data Table](./data-table.md) view. This allows you to see a sample list of nodes under this type and choose one or more nodes to "Send to Explorer" for getting started quickly if you are new to the data. You can also navigate directly to the Data Table view using the "Data Table" link in the navigation bar.
