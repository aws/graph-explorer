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
  
  export type OCVertexProperty = {
    "@type": "g:VertexProperty";
    "@value": {
      id: OCInt32;
      label: string;
      value: string | OCInt32 | OCDouble | OCDate;
    };
  };
  
  export type OCProperty = {
    "@type": "g:Property";
    "@value": {
      id: OCInt32;
      key: string;
      value: string | OCInt32 | OCDouble | OCDate;
    };
  };
  
  export type OCVertex = {
    "@type": "g:Vertex";
    "@value": {
      id: string;
      label: string;
      properties: Record<string, Array<OCVertexProperty>>;
    };
  };
  
  export type OCEdge = {
    "@type": "g:Edge";
    "@value": {
      id: string;
      label: string;
      inVLabel: string;
      inV: string;
      outVLabel: string;
      outV: string;
      properties?: Record<string, OCProperty>;
    };
  };
  
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
  