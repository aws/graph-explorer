type LabelKey =
  | "total-nodes"
  | "total-edges"
  | "node"
  | "node-id"
  | "node-type"
  | "node-attribute"
  | "nodes-types"
  | "edge"
  | "edge-type"
  | "edges-types"
  | "search-placeholder"
  | "total-prefixes"
  | "conn-data-no-results-title"
  | "conn-data-no-results-subtitle"
  | "conn-data-no-elements-title"
  | "conn-data-no-elements-subtitle"
  | "source-id"
  | "source-type"
  | "target-id"
  | "target-type"
  | "nodes-tabular-placeholder"
  | "edges-tabular-placeholder";

const labelsByEngine: Record<"gremlin" | "sparql", Record<LabelKey, string>> = {
  gremlin: {
    "total-nodes": "Total Nodes",
    "total-edges": "Total Edges",
    node: "Node",
    "node-id": "Node Id",
    "node-type": "Node Type",
    "node-attribute": "Attribute",
    "nodes-types": "Nodes Types",
    edge: "Edge",
    "edge-type": "Edge Type",
    "edges-types": "Edges Types",
    "total-prefixes": "Total Prefixes",
    "search-placeholder": "Search for Node Type",
    "conn-data-no-results-title": "No Nodes Types",
    "conn-data-no-results-subtitle":
      "No Nodes Types found with searched criteria",
    "conn-data-no-elements-title": "No Nodes",
    "conn-data-no-elements-subtitle": "No Nodes found to be shown in this list",
    "source-id": "Source Id",
    "source-type": "Source Type",
    "target-id": "Target Id",
    "target-type": "Target Type",
    "nodes-tabular-placeholder": "Drop a node in the explorer see its data",
    "edges-tabular-placeholder":
      "Drop a node in the explorer see its connections",
  },
  sparql: {
    "total-nodes": "Total Resources",
    "total-edges": "Total Predicates",
    "total-prefixes": "Total Prefixes",
    node: "Resource",
    "node-id": "Resource URI",
    "node-type": "Class",
    "node-attribute": "Predicate",
    "nodes-types": "Classes",
    edge: "Predicate",
    "edge-type": "Predicate",
    "edges-types": "Predicates",
    "search-placeholder": "Search for Classes",
    "conn-data-no-results-title": "No Classes",
    "conn-data-no-results-subtitle": "No Classes found with searched criteria",
    "conn-data-no-elements-title": "No Resources",
    "conn-data-no-elements-subtitle":
      "No Resources found to be shown in this list",
    "source-id": "Source URI",
    "source-type": "Source Class",
    "target-id": "Target URI",
    "target-type": "Target Class",
    "nodes-tabular-placeholder":
      "Drop resources in the explorer see their information",
    "edges-tabular-placeholder":
      "Drop resources in the explorer see their predicates",
  },
};

export default labelsByEngine;
