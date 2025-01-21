import { z } from "zod";

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

export type GScalar = GInt32 | GInt64 | GDouble | GDate | string;

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
    id: GInt32;
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

export type GAnyValue = GList | GMap | GSet | GPath | GVertex | GEdge | GScalar;

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

/*
 * The following types are used to represent the results of a gremlin query.
 */

export const gremlinIntegerSchema = z.object({
  "@type": z.literal("g:Int32"),
  "@value": z.number(),
});

export const gremlinLongSchema = z.object({
  "@type": z.literal("g:Int64"),
  "@value": z.number(),
});

export const gremlinDoubleSchema = z.object({
  "@type": z.literal("g:Double"),
  "@value": z.number(),
});

export const gremlinDateSchema = z.object({
  "@type": z.literal("g:Date"),
  "@value": z.number(),
});

export const gremlinTimestampSchema = z.object({
  "@type": z.literal("g:Timestamp"),
  "@value": z.number(),
});

export const gremlinUuidSchema = z.object({
  "@type": z.literal("g:UUID"),
  "@value": z.string().uuid(),
});

export const gremlinBooleanSchema = z.boolean();

export const gremlinStringSchema = z.string();

export const gremlinPropertySchema = z.object({
  "@type": z.literal("g:VertexProperty"),
  "@value": z.object({
    id: gremlinIntegerSchema,
    value: z.union([
      gremlinIntegerSchema,
      gremlinDateSchema,
      gremlinStringSchema,
      gremlinLongSchema,
      gremlinDoubleSchema,
      gremlinBooleanSchema,
      gremlinUuidSchema,
      gremlinTimestampSchema,
    ]),
    label: z.string(),
  }),
});

export const gremlinEdgePropertySchema = z.object({
  "@type": z.literal("g:Property"),
  "@value": z.object({
    key: z.string(),
    value: z.union([
      gremlinIntegerSchema,
      gremlinDateSchema,
      gremlinStringSchema,
      gremlinLongSchema,
      gremlinDoubleSchema,
      gremlinBooleanSchema,
      gremlinUuidSchema,
      gremlinTimestampSchema,
    ]),
  }),
});

export const gremlinVertexSchema = z.object({
  "@type": z.literal("g:Vertex"),
  "@value": z.object({
    id: z.string(),
    label: z.string(),
    properties: z.record(z.string(), z.array(gremlinPropertySchema)),
  }),
});

export const gremlinEdgeSchema = z.object({
  "@type": z.literal("g:Edge"),
  "@value": z.object({
    id: z.union([gremlinIntegerSchema, gremlinStringSchema]),
    label: z.string(),
    inVLabel: z.string(),
    outVLabel: z.string(),
    inV: z.union([gremlinIntegerSchema, gremlinStringSchema]),
    outV: z.union([gremlinIntegerSchema, gremlinStringSchema]),
    properties: z.record(z.string(), gremlinEdgePropertySchema),
  }),
});

export function gremlinListSchema<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    "@type": z.literal("g:List"),
    "@value": z.array(schema),
  });
}

export function gremlinResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    requestId: z.string(),
    status: z.object({
      message: z.string(),
      code: z.number(),
    }),
    result: z.object({
      data: dataSchema,
    }),
  });
}
