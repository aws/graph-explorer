export type OCProperties = Record<string, string | number>;

export type OCVertex = {
  "~id": string;
  "~entityType": string;
  "~labels": Array<string>;
  "~properties": OCProperties;
};

export type OCEdge = {
  "~id": string;
  "~entityType": string;
  "~start": string;
  "~end": string;
  "~type": string;
  "~properties": OCProperties;
};

export type OpenCypherFetch = <TResult = any>(
  queryTemplate: string
) => Promise<TResult>;

export type GraphSummary = {
  numNodes: number;
  numEdges: number;
  numNodeLabels: number;
  numEdgeLabels: number;
  nodeLabels: Array<string>;
  edgeLabels: Array<string>;
  numNodeProperties: number;
  numEdgeProperties: number;
  nodeProperties: Record<string, number>;
  edgeProperties: Record<string, number>;
  totalNodePropertyValues: number;
  totalEdgePropertyValues: number;
};
