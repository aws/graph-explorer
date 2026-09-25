[← Features](./)

# Connections

You can create and manage connections to graph databases using this feature. Connections is accessible as the first screen after deploying the application or by clicking `Connections` in the navigation bar. Click `+` on the top-right to add a new connection. You can also edit and delete connections.

For guides on connecting to specific databases, see [Connecting to databases](../guides#connecting-to-databases).

## Add a New Connection

- **Name:** Enter a name for your connection (e.g., `MyNeptuneCluster`).
- **Query Language:** Choose a query language that corresponds to your graph database.
- **Public or proxy endpoint:** Provide the publicly accessible endpoint URL for a graph database, e.g., Gremlin Server. If connecting to Amazon Neptune, then provide a proxy endpoint URL that is accessible from outside the VPC, e.g., EC2.
  - **Note:** For connecting to Amazon Neptune, ensure that the graph connection URL is in the format `https://[NEPTUNE_ENDPOINT]:8182`, and that the proxy endpoint URL is either `https://[EC2_PUBLIC_HOSTNAME]:443` or `http://[EC2_PUBLIC_HOSTNAME]:80`, depending on the protocol used. Ensure that you don't end either of the URLs with `/`.
- **Using proxy server:** Check this box if using a proxy endpoint.
- **Graph connection URL:** Provide the endpoint for the graph database
- **AWS IAM Auth Enabled:** Check this box if connecting to Amazon Neptune using IAM Auth and SigV4 signed requests
- **Service Type:** Choose the service type
- **AWS Region:** Specify the AWS region where the Neptune cluster is hosted (e.g., us-east-1)
- **Fetch Timeout:** Specify the timeout for the fetch request
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

## Connection Links

External applications can link directly to Graph Explorer with a connection pre-configured by opening the `#/connect` route with query parameters. Graph Explorer reads the parameters, then either switches to the matching connection or opens a pre-filled create form for a new one.

### Parameters

| Parameter     | Required | Default                                                        | Description                                                                                                                                                                                                 |
| ------------- | -------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `graphDbUrl`  | Yes      | None                                                           | The graph database endpoint, URL-encoded. The link is invalid without it.                                                                                                                                   |
| `queryEngine` | No       | `gremlin` (`openCypher` when `serviceType` is `neptune-graph`) | One of `gremlin`, `openCypher`, or `sparql`. An unsupported value makes the link invalid rather than falling back, and `neptune-graph` only accepts `openCypher` (Neptune Analytics has no other language). |
| `awsRegion`   | No       | None                                                           | AWS region for the connection, shaped like `us-east-1`. Providing a region enables IAM auth (SigV4 signed requests). An absent or empty value leaves IAM off.                                               |
| `serviceType` | No       | `neptune-db` (when IAM is on)                                  | One of `neptune-db` or `neptune-graph`. Only affects the connection when `awsRegion` is set. An unsupported value makes the link invalid either way.                                                        |
| `name`        | No       | The endpoint's hostname                                        | Display label for the connection. Defaults to the full hostname of `graphDbUrl`.                                                                                                                            |

The parameters belong to the `#/connect` route, so they go _after_ the `#` (Graph Explorer uses hash-based routing). `graphDbUrl` must be URL-encoded. Most languages provide this via `encodeURIComponent()` (JavaScript), `urllib.parse.quote()` (Python), or `URLEncoder.encode()` (Java).

### Example

```
https://[GRAPH_EXPLORER_HOST]/#/connect?graphDbUrl=https%3A%2F%2Fmy-cluster.us-east-1.neptune.amazonaws.com%3A8182&queryEngine=gremlin&awsRegion=us-east-1&serviceType=neptune-db&name=My%20Database
```

### Behavior

When you open a connection link, Graph Explorer does one of the following:

- **The link matches your active connection.** Nothing changes.
- **The link matches a different existing connection.** Graph Explorer switches to it, the same as selecting it in the connections list. No prompt: the connection was already created and validated by you, so there is nothing new to confirm.
- **The link matches no existing connection.** The create-connection form opens, pre-filled with the link's details so you can review or edit any setting before creating it. Saving the form creates the connection, activates it, and opens the graph view. Cancelling the form, or pressing Escape, creates nothing and opens the connections list so you can pick a connection yourself.
- **The link's details are invalid.** The link is ignored and a notification names the parameter at fault and what it requires, for example "graphDbUrl must be a valid http or https URL".

In every case Graph Explorer replaces the `#/connect` URL once the link is handled, so it does not linger in your history and refreshing behaves normally.

#### What makes a link invalid

- `graphDbUrl` is missing or empty. The `#/connect` route exists only for connection links, so a link with nothing to connect to is invalid rather than a silent no-op.
- `graphDbUrl` is not a valid URL, or does not use `http`/`https`.
- `graphDbUrl` includes a username or password. Graph Explorer authenticates with AWS IAM, and browsers refuse to send a request to a URL that carries credentials.
- `graphDbUrl` contains a backslash. Browsers read a backslash as a slash, so a link could otherwise show one host and connect to another.
- `queryEngine` names something other than `gremlin`, `openCypher`, or `sparql`, or names anything other than `openCypher` while `serviceType` is `neptune-graph`.
- `serviceType` names something other than `neptune-db` or `neptune-graph`.
- `awsRegion` is present but not shaped like an AWS region (for example `us-east-1`).

An unsupported value is rejected rather than replaced with a default, so a link never quietly connects you with settings you did not ask for. Every offending parameter is reported together, not just the first one found.

#### What counts as a match

A link matches an existing connection only when its endpoint, query engine, **and authentication posture** all agree:

- the same `graphDbUrl` (normalized and compared case-insensitively, so a trailing slash or stray whitespace on either side doesn't prevent a match) and the same `queryEngine`, and
- the same auth posture: whether IAM is on (a link enables it by providing `awsRegion`), and when it is on, the same `awsRegion` and `serviceType`.

Authentication is part of a connection's identity: a link requesting IAM in a region is a _different_ connection from a plaintext one to the same endpoint, and vice versa. A link whose auth posture differs from every existing connection never silently reuses one. It opens the pre-filled create form instead, where you can review the authentication settings before connecting.

When several connections match, Graph Explorer picks one in priority order: your active connection first (so a link targeting it is a no-op), then the connection whose name equals the link's `name` parameter (the endpoint's hostname when `name` is omitted), then the first match found. `name` never prevents a match on its own, so a connection you have since renamed still matches a link that was built with its old name.
