import { GInt64, GVertex } from "@/connector/gremlin/types";
import { getRawId, Vertex } from "@/core";

export function createGremlinResponseFromVertex(vertex: Vertex) {
  return {
    result: {
      data: {
        "@type": "g:List",
        "@value": [createGVertex(vertex)],
      },
    },
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
      properties: createProperties(vertex.attributes),
    },
  };
}

function createProperties(
  attributes: Vertex["attributes"]
): GVertex["@value"]["properties"] {
  const mapped = Object.entries(attributes).map(([key, value]) => ({
    "@type": "g:VertexProperty",
    "@value": {
      label: key,
      value:
        typeof value === "string"
          ? value
          : {
              "@type": "g:Int64",
              "@value": value,
            },
    },
  }));

  const result = {} as Record<string, any>;
  mapped.forEach(prop => {
    result[prop["@value"].label] = [prop];
  });

  return result;
}
