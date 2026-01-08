# Requirements Document

## Introduction

The Schema Explorer feature provides a visual representation of the graph
database schema for the active connection. It displays node labels as nodes in a
graph canvas, with edges representing the relationships between node types. This
feature enables users to understand the structure of their graph database
without writing queries, complementing the existing Graph Explorer
functionality.

## Glossary

- **Schema Explorer**: A new route/view that visualizes the database schema as a
  graph
- **Node Label**: A vertex type in the graph database (e.g., "Person",
  "Company")
- **Edge Type**: A relationship type connecting node labels (e.g., "WORKS_AT",
  "KNOWS")
- **Schema Graph**: The visual representation where node labels become nodes and
  edge types become edges
- **Edge Connection**: A distinct combination of source node label, edge type,
  and target node label
- **Schema Sync**: The process of discovering database schema information from
  the connected graph database

## Requirements

### Requirement 1

**User Story:** As a user, I want to navigate to the Schema Explorer from the
connections page and graph explorer, so that I can easily access the schema
visualization.

#### Acceptance Criteria

1. WHEN a user is on the connections page THEN the Schema Explorer SHALL display
   a navigation link to the Schema Explorer route
2. WHEN a user is on the graph explorer page THEN the Schema Explorer SHALL
   display a navigation link to the Schema Explorer route
3. WHEN a user navigates to the Schema Explorer route THEN the Schema Explorer
   SHALL display the schema visualization for the active connection
4. WHEN no active connection exists THEN the Schema Explorer SHALL redirect the
   user to the connections page

### Requirement 2

**User Story:** As a user, I want to see node labels visualized as nodes in the
schema graph, so that I can understand what types of entities exist in my
database.

#### Acceptance Criteria

1. WHEN the Schema Explorer loads THEN the Schema Explorer SHALL display each
   node label from the schema as a distinct node in the graph canvas
2. WHEN a node label has a configured display label THEN the Schema Explorer
   SHALL display the configured display label on the node
3. WHEN a node label has a configured icon THEN the Schema Explorer SHALL
   display the configured icon on the node
4. WHEN a node label has a configured color THEN the Schema Explorer SHALL
   display the node with the configured color

### Requirement 3

**User Story:** As a user, I want to select a node label in the schema graph, so
that I can view detailed information about that node type.

#### Acceptance Criteria

1. WHEN a user selects a node in the schema graph THEN the Schema Explorer SHALL
   display a details panel showing the node label properties
2. WHEN displaying node label details THEN the Schema Explorer SHALL show each
   attribute name and its data type
3. WHEN a node label has a total count THEN the Schema Explorer SHALL display
   the count of nodes of that type
4. WHEN a user deselects a node THEN the Schema Explorer SHALL hide the details
   panel

### Requirement 4

**User Story:** As a user, I want to see edges between node labels representing
relationships, so that I can understand how different entity types are
connected.

#### Acceptance Criteria

1. WHEN the Schema Explorer loads THEN the Schema Explorer SHALL display edges
   connecting node labels based on discovered edge connections
2. WHEN an edge type connects two node labels THEN the Schema Explorer SHALL
   display an edge from the source node label to the target node label
3. WHEN multiple edge types exist between the same node labels THEN the Schema
   Explorer SHALL display each edge type as a separate edge
4. WHEN an edge type connects a node label to itself THEN the Schema Explorer
   SHALL display a self-referencing edge

### Requirement 5

**User Story:** As a user, I want the schema sync to discover edge connections
between node types, so that the Schema Explorer can display relationship
information.

#### Acceptance Criteria

1. WHEN a schema sync occurs THEN the Schema Explorer SHALL query the database
   for distinct edge connections
2. WHEN discovering edge connections THEN the Schema Explorer SHALL identify the
   source node label, edge type, and target node label for each connection
3. WHEN edge connections are discovered THEN the Schema Explorer SHALL store the
   connections in the schema data structure
4. WHEN the schema is serialized THEN the Schema Explorer SHALL include edge
   connection data for persistence
5. WHEN the schema is deserialized THEN the Schema Explorer SHALL restore edge
   connection data

### Requirement 6

**User Story:** As a user, I want to interact with the schema graph using
standard graph controls, so that I can explore the schema effectively.

#### Acceptance Criteria

1. WHEN viewing the schema graph THEN the Schema Explorer SHALL provide zoom in
   and zoom out controls
2. WHEN viewing the schema graph THEN the Schema Explorer SHALL provide a
   fit-to-canvas control
3. WHEN viewing the schema graph THEN the Schema Explorer SHALL provide layout
   selection options
4. WHEN viewing the schema graph THEN the Schema Explorer SHALL allow panning
   and zooming with mouse/trackpad gestures

### Requirement 7

**User Story:** As a user, I want to select an edge in the schema graph, so that
I can view information about that relationship type.

#### Acceptance Criteria

1. WHEN a user selects an edge in the schema graph THEN the Schema Explorer
   SHALL display a details panel showing the edge type information
2. WHEN displaying edge type details THEN the Schema Explorer SHALL show the
   edge type name
3. WHEN displaying edge type details THEN the Schema Explorer SHALL show the
   source and target node labels
4. WHEN an edge type has attributes THEN the Schema Explorer SHALL display each
   attribute name and its data type
5. WHEN an edge type has a total count THEN the Schema Explorer SHALL display
   the count of edges of that type

### Requirement 8

**User Story:** As a user, I want the Schema Explorer to handle empty or
incomplete schemas gracefully, so that I can still use the feature during
initial setup.

#### Acceptance Criteria

1. WHEN the schema has no node labels THEN the Schema Explorer SHALL display an
   empty state message
2. WHEN the schema has node labels but no edge connections THEN the Schema
   Explorer SHALL display nodes without edges
3. WHEN the schema sync is in progress THEN the Schema Explorer SHALL display a
   loading indicator
4. WHEN the schema sync fails THEN the Schema Explorer SHALL display an error
   message with retry option
