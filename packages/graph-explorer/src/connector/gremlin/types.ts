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

export type GScalar =
  | GInt32
  | GInt64
  | GDouble
  | GType
  | GDate
  | string
  | boolean;

export type JanusID = {
  "@type": "janusgraph:RelationIdentifier";
  "@value": {
    relationId: string;
  };
};

export type GVertexProperty = {
  "@type": "g:VertexProperty";
  "@value": {
    id: GInt32;
    label: string;
    value: GScalar;
  };
};

export type GProperty = {
  "@type": "g:Property";
  "@value": {
    id?: GInt32;
    key: string;
    value: GScalar;
  };
};

export type GVertex = {
  "@type": "g:Vertex";
  "@value": {
    id: string | GInt64;
    label: string;
    properties?: Record<string, Array<GVertexProperty>>;
  };
};

export type GEdge = {
  "@type": "g:Edge";
  "@value": {
    id: string | GInt64 | JanusID;
    label: string;
    inV: string | GInt64;
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

export type GPath = {
  "@type": "g:Path";
  "@value": {
    labels: GList;
    objects: GList;
  };
};

export type GList = {
  "@type": "g:List";
  "@value": Array<GAnyValue>;
};

export type GMapWithValue<Key, Value> = {
  "@type": "g:Map";
  "@value": Array<Key | Value>;
};

export type GMap = {
  "@type": "g:Map";
  "@value": Array<GAnyValue>;
};

export type GSet = {
  "@type": "g:Set";
  "@value": Array<GAnyValue>;
};

export type GEntityList = {
  "@type": "g:List";
  "@value": Array<GVertex | GEdge>;
};

export type GType = {
  "@type": "g:T";
  "@value": string;
};

export type GAnyValue =
  | GList
  | GMap
  | GSet
  | GPath
  | GVertex
  | GEdge
  | GScalar
  | GType
  | null;

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
