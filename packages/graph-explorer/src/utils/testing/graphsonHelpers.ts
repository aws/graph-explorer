import {
  GAnyValue,
  GEdge,
  GInt64,
  GList,
  GProperty,
  GScalar,
  GVertex,
} from "@/connector/gremlin/types";
import { Edge, EdgeId, getRawId, Vertex, VertexId } from "@/core";

export function createGremlinResponseFromVertex(vertex: Vertex) {
  return {
    result: {
      data: createGList([createGVertex(vertex)]),
    },
  };
}

export function createGList(items: GAnyValue[]): GList {
  return {
    "@type": "g:List",
    "@value": items,
  };
}

export function createGVertex(vertex: Vertex): GVertex {
  // Create graphSON ID value
  const id = (() => {
    const rawId = getRawId(vertex.id);

    if (typeof rawId === "string") {
      return rawId;
    }

    return {
      "@type": "g:Int64",
      "@value": rawId,
    } satisfies GInt64;
  })();

  return {
    "@type": "g:Vertex",
    "@value": {
      id,
      label: vertex.types.join("::"),
      properties: vertex.__isFragment
        ? undefined
        : createGVertexProperties(vertex.attributes),
    },
  };
}

export function createGEdge(edge: Edge): GEdge {
  return {
    "@type": "g:Edge",
    "@value": {
      id: createIdValue(edge.id),
      label: edge.type,
      inVLabel: edge.targetTypes.join("::"),
      outVLabel: edge.sourceTypes.join("::"),
      inV: createIdValue(edge.target),
      outV: createIdValue(edge.source),
      properties: edge.__isFragment
        ? undefined
        : createGProperties(edge.attributes),
    },
  };
}

function createGVertexProperties(
  attributes: Vertex["attributes"]
): GVertex["@value"]["properties"] {
  const mapped = Object.entries(attributes).map(([key, value]) => ({
    "@type": "g:VertexProperty",
    "@value": {
      label: key,
      value: createGValue(value),
    },
  }));

  const result = {} as Record<string, any>;
  mapped.forEach(prop => {
    result[prop["@value"].label] = [prop];
  });

  return result;
}

function createGValue(value: string | number): GScalar {
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }

    return value;
  }

  return {
    "@type": "g:Int64",
    "@value": value,
  };
}

function createGProperties(
  attributes: Edge["attributes"]
): Record<string, GProperty> {
  return Object.entries(attributes)
    .map(
      ([key, value]) =>
        ({
          "@type": "g:Property",
          "@value": {
            key,
            value: createGValue(value),
          },
        }) satisfies GProperty
    )
    .reduce(
      (result, curr) => {
        result[curr["@value"].key] = curr;
        return result;
      },
      {} as Record<string, GProperty>
    );
}

function createIdValue(id: VertexId | EdgeId) {
  const rawId = getRawId(id);

  if (typeof rawId === "string") {
    return rawId;
  }

  return {
    "@type": "g:Int64",
    "@value": rawId,
  } satisfies GInt64;
}
