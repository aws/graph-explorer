export type GInt32 = {
  "@type": "g:Int32";
  "@value": number;
};

export type GInt64 = {
  "@type": "g:Int64";
  "@value": number;
};

export type GDouble = {
  "@type": "g:Double";
  "@value": number;
};

export type GDate = {
  "@type": "g:Date";
  "@value": number;
};

export type JanusID = {
  "@type": "janusgraph:RelationIdentifier",
  "@value": {
    "relationId": string
  }
}

export type GVertexProperty = {
  "@type": "g:VertexProperty";
  "@value": {
    id: GInt32;
    label: string;
    value: string | GInt32 | GDouble | GDate;
  };
};

export type GProperty = {
  "@type": "g:Property";
  "@value": {
    id: GInt32;
    key: string;
    value: string | GInt32 | GDouble | GDate;
  };
};

export type GVertex = {
  "@type": "g:Vertex";
  "@value": {
    id: string | GInt64;
    label: string;
    properties: Record<string, Array<GVertexProperty>>;
  };
};

export type GEdge = {
  "@type": "g:Edge";
  "@value": {
    id: string | GInt64 | JanusID;
    label: string;
    inVLabel: string;
    inV: string | GInt64;
    outVLabel: string;
    outV: string | GInt64;
    properties?: Record<string, GProperty>;
  };
};

export type GVertexList = {
  "@type": "g:List";
  "@value": Array<GVertex>;
};

export type GEdgeList = {
  "@type": "g:List";
  "@value": Array<GEdge>;
};

export type GremlinFetch = <TResult = any>(
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
