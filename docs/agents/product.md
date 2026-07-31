# Graph Explorer Product Overview

Graph Explorer is a React-based web application that enables users to visualize and explore graph data without writing queries. It supports multiple graph database types and query languages.

## Core Purpose

- Visualize property graphs (LPG) and RDF data
- Interactive graph exploration without requiring query knowledge
- Connect to various graph databases over HTTP

## Supported Graph Types & Query Languages

- **Property Graphs**: Gremlin, openCypher
- **RDF Graphs**: SPARQL 1.1 protocol
- **Databases**: Amazon Neptune, Amazon Neptune Analytics, Apache TinkerPop Gremlin Server REST endpoints, JanusGraph

## Key Features

- **Connections Management**: Create and manage database connections
- **Graph Visualization**: Interactive graph view with search, custom queries, and styles
- **Tabular View**: Show/hide nodes and edges, export to CSV/JSON
- **Data Table View**: List all nodes and properties for a specific node type and send to graph view
- **Schema View**: View node types and their relationships as a graph
- **Authentication**: AWS IAM authentication via SigV4 signing protocol

## Architecture

- **Frontend**: TypeScript React application served via Vite
- **Backend**: Express.js proxy server for authentication and request routing
- **Deployment**: Docker containers, supports local and cloud deployment (EC2, ECS)

## Key Architectural Patterns

- State management: Jotai atoms for global state
- Data fetching: TanStack Query for remote data
- Graph rendering: Cytoscape.js with custom layout plugins
- Query abstraction: Explorers provide unified interfaces for different query languages
- Configuration: environment variables and configuration providers
- Error handling: error boundaries and consistent error display components
- State persistence: localforage for client-side persistence using IndexedDB

## Data Storage & Persistence

- Client-side only — all user data and styles are stored client-side; the backend proxy server stores nothing
- IndexedDB via localforage is the primary storage mechanism
- Persisted: user styles and settings, connection configurations, query history, visualization settings, layout preferences
- Graph data is queried directly from the connected databases and is not owned or persisted by Graph Explorer
