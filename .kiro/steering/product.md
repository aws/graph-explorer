# Graph Explorer Product Overview

Graph Explorer is a React-based web application that enables users to visualize
and explore graph data without writing queries. It supports multiple graph
database types and query languages.

## Core Purpose

- Visualize property graphs (LPG) and RDF data
- Interactive graph exploration without requiring query knowledge
- Connect to various graph databases over HTTP

## Supported Graph Types & Query Languages

- **Property Graphs**: Gremlin, openCypher
- **RDF Graphs**: SPARQL 1.1 protocol
- **Databases**: Amazon Neptune, Amazon Neptune Analytics, Apache TinkerPop
  Gremlin Server REST endpoints, JanusGraph

## Key Features

- **Connections Management**: Create and manage database connections
- **Graph Visualization**: Interactive graph view with search, custom queries,
  and styling
- **Tabular View**: Show/hide nodes and edges, export to CSV/JSON
- **Data Explorer**: List all nodes and properties for a specific node type and
  send to graph view
- **Authentication**: AWS IAM authentication via SigV4 signing protocol

## Architecture

- **Frontend**: TypeScript React application served via Vite
- **Backend**: Express.js proxy server for authentication and request routing
- **Deployment**: Docker containers, supports local and cloud deployment (EC2,
  ECS)
