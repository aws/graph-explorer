# Getting Started

A hands-on tutorial that walks you through Graph Explorer using the air routes sample dataset. By the end, you will have searched for airports, explored connections between them, filtered the graph, styled nodes, and viewed data in a table.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine

## Launch Graph Explorer

The fastest way to try Graph Explorer is with the [Air Routes sample](../../samples/air_routes/README.md). It launches Graph Explorer and a Gremlin Server pre-loaded with sample data using Docker Compose — no database setup or AWS account required.

1. Clone the repository
   ```
   git clone https://github.com/aws/graph-explorer.git
   ```
2. Navigate to the sample directory and start the containers
   ```
   cd graph-explorer/samples/air_routes
   docker compose up
   ```
3. Open your browser and navigate to [http://localhost:8080/explorer](http://localhost:8080/explorer)

Graph Explorer opens to the **Connections** page. You should see a "Default Connection" already configured and connected to the Gremlin Server with the air routes data.

## Tour the UI

Graph Explorer has four main pages, accessible from the navigation bar at the top:

- **Graph** — The main visualization canvas where you explore nodes and edges interactively.
- **Data Table** — A paginated table view of all nodes in the database, organized by type.
- **Schema** — A visual overview of the schema showing how node types and edge types relate to each other.
- **Connections** — Where you manage database connections. This is where you landed after launching.

Click **Graph** in the navigation bar to switch to the graph view. The canvas is empty because no nodes have been added yet.

On the right side of the graph view, you will see a vertical strip of sidebar icons. These open panels for **Search**, **Expand**, **Details**, **Entities Filter**, and **Node Label Styling**. You will use each of these as you work through the tutorial.

## Search for a Node

1. Click the **Search** icon (magnifying glass) in the right sidebar to open the Search panel.
2. In the **Node Label** dropdown, select **airport**.
3. In the **Property** dropdown, select **code**.
4. In the search text field, type `AUS`.
5. Click the result for Austin to expand it, then click the **⊕** button to add it to the graph canvas.

The node appears on the canvas. Click it to select it, then open the **Details** panel in the right sidebar to see its properties like city, country, and coordinates. You can zoom with the scroll wheel and pan by clicking and dragging the background.

## Expand Neighbors

With the Austin airport node on the canvas, let's discover what it connects to.

1. **Double-click** the AUS node on the canvas.

Graph Explorer fetches up to 10 neighbors and adds them to the graph. The number on top of a node shows how many unexpanded neighbors remain. Double-click again to fetch the next batch.

<!-- prettier-ignore -->
> [!TIP]
>
> You can also right-click a node and select **Expand node** from the context
> menu, or use the **Expand** sidebar panel for more control over which neighbor
> types to fetch.

## Filter the Graph

As you expand nodes, the graph can get crowded. The Entities Filter lets you focus on specific types.

1. Click the **Filters** icon in the right sidebar to open the Entities Filter panel.
2. You will see two tabs: **Node Labels** and **Edge Labels**. Each tab lists the types currently in the graph with checkboxes.
3. Try unchecking a node label to hide those nodes from the canvas. Check it again to bring them back.

This does not remove nodes from the graph — it only controls visibility. You can use this to temporarily focus on a subset of the data.

## Style Nodes

You can customize how each node type looks on the canvas.

1. Click the **Node Label Styling** icon in the right sidebar.
2. Find the **airport** type in the list.
3. Click **Customize** to open the style dialog.
4. Change the **Node Color** to a color of your choice using the color picker.
5. Click **Done** to apply.

All airport nodes on the canvas update to the new color. You can also change the shape, border, icon, and which property is displayed as the node label using the **Display Name Property** dropdown.

## Switch to the Data Table

The Data Table page lets you browse all nodes in the database without adding them to the graph first.

1. Click **Data Table** in the navigation bar.
2. Use the **Node Label** dropdown at the top left to select **airport**.
3. Browse the paginated table of all airports in the dataset.
4. To send a specific airport to the graph view, click the **Send to Explorer** button on its row.

You can also toggle a table view directly within the Graph page by clicking the grid icon in the graph toolbar. This shows a table of only the nodes currently on the canvas.

## Next Steps

Now that you have explored the basics, here are some directions to go next:

- [Connecting to databases](../guides#connecting-to-databases) — Connect to Neptune, Gremlin Server, or BlazeGraph
- [Deployment guides](../guides#deployment) — Deploy with Docker, EC2, ECS Fargate, or SageMaker
- [Configuration](../references/configuration.md) — Environment variables for application settings and default connections
- [Development](../development.md) — Build from source for local development
- [Troubleshooting](../guides/troubleshooting.md) — Common issues and workarounds
- [Samples](../../samples) — More Docker Compose examples for different configurations
