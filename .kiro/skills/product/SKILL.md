---
name: product
description: "Graph Explorer product context — supported databases, query languages, features, and architecture. Use when the user asks about Graph Explorer capabilities, deployment options, supported databases, query language choices, or how the system is structured."
---

# Graph Explorer Product Overview

Graph Explorer is a React-based web application for visualizing and exploring graph data without writing queries. It supports multiple graph databases and query languages through a connector abstraction.

## Quickstart

Clone the repo and launch with the Air Routes sample dataset:

```bash
cd graph-explorer/samples/air_routes
docker compose up
```

Open [http://localhost:8080/explorer](http://localhost:8080/explorer). A default Gremlin connection is pre-configured.

For production deployment, pull the official image from ECR Public:

```bash
docker pull public.ecr.aws/neptune/graph-explorer
docker run -p 80:80 -p 443:443 --env HOST=localhost public.ecr.aws/neptune/graph-explorer
```

Then open `https://localhost/explorer`.

## Supported Databases & Query Languages

| Graph Model | Query Language | Databases |
|---|---|---|
| Property Graph (LPG) | Gremlin | Amazon Neptune, Apache TinkerPop Gremlin Server, JanusGraph |
| Property Graph (LPG) | openCypher | Amazon Neptune, Amazon Neptune Analytics |
| RDF | SPARQL 1.1 | Amazon Neptune |

**When to use which:**
- **Gremlin** — Traversal-based queries on property graphs. Best for path-finding and step-by-step graph walks.
- **openCypher** — Declarative pattern matching on property graphs. Best for subgraph pattern queries.
- **SPARQL** — RDF triple pattern matching. Required when the data is RDF/linked data.

## Key Features

- **Connections**: Create and manage database connections (`Connections` page). See `docs/features/connections.md`.
- **Graph View**: Interactive canvas with search, neighbor expansion, custom queries, and node styling. See `docs/features/graph-view.md`.
- **Data Table**: Paginated tabular view with export to CSV/JSON. See `docs/features/data-table.md`.
- **Schema View**: Visual overview of node types and edge relationships. See `docs/features/schema-view.md`.
- **AWS IAM Auth**: SigV4 signing via the proxy server for Neptune connections.

## Architecture

Two packages in a pnpm monorepo:

- **`packages/graph-explorer`** — React client. Constructs queries, manages state (Jotai atoms), renders the graph (Cytoscape.js), and caches remote data (TanStack Query).
- **`packages/graph-explorer-proxy-server`** — Express server. Forwards requests to the database, handles SigV4 signing for Neptune, and serves built client assets.

The proxy exists because browsers cannot perform SigV4 signing directly. For non-Neptune databases, the client can connect to the endpoint directly (no proxy required). All user data (preferences, connections, query history) is stored client-side in IndexedDB via localforage.

See `docs/architecture.md` for the full system diagram and library reference.
