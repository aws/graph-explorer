export type OCInt32 = {
  "@type": "g:Int32";
  "@value": number;
};

export type OCInt64 = {
  "@type": "g:Int64";
  "@value": number;
};

export type OCDouble = {
  "@type": "g:Double";
  "@value": number;
};

export type OCDate = {
  "@type": "g:Date";
  "@value": number;
};

export type OCVertex = {
  "~id": string;
  "~entityType": string;
  "~labels": Array<string>;
  "~properties": Record<string, string | number>;
}

export type OCEdge = {
  "~id": string;
  "~entityType": string;
  "~start": string;
  "~end": string;
  "~type": string;
  "~properties": Record<string, string | number>;
}

export type OCVertexList = {
  "@type": "g:List";
  "@value": Array<OCVertex>;
};

export type OCEdgeList = {
  "@type": "g:List";
  "@value": Array<OCEdge>;
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
