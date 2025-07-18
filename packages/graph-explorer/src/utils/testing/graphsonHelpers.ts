import {
  GAnyValue,
  GDate,
  GDouble,
  GEdge,
  GInt32,
  GInt64,
  GList,
  GMap,
  GProperty,
  GScalar,
  GVertex,
  GVertexProperty,
} from "@/connector/gremlin/types";
import {
  Edge,
  EdgeId,
  EntityPropertyValue,
  getRawId,
  Vertex,
  VertexId,
} from "@/core";
import { createRandomInteger } from "@shared/utils/testing";

export function createGremlinResponseFromVertices(...vertices: Vertex[]) {
  return createGremlinResponse(...vertices.map(createGVertex));
}

export function createGremlinResponse<Value extends GAnyValue>(
  ...values: Value[]
) {
  return {
    result: {
      data: createGList(values),
    },
  };
}

export function createGList(items: GAnyValue[]): GList {
  return {
    "@type": "g:List",
    "@value": items,
  };
}

export function createGMap<Value extends EntityPropertyValue | GAnyValue>(
  values: Record<string, Value>
): GMap {
  const mapItems: GAnyValue[] = [];
  for (const [key, value] of Object.entries(values)) {
    mapItems.push(key);
    if (
      typeof value === "boolean" ||
      typeof value === "string" ||
      typeof value === "number"
    ) {
      mapItems.push(createGValue(value));
    } else if (typeof value === "object" && "@type" in value) {
      mapItems.push(value);
    } else {
      throw new Error(
        "Automatic mapping to GAnyValue not yet supported. Update the logic to support this type"
      );
    }
  }
  const result: GMap = {
    "@type": "g:Map",
    "@value": mapItems,
  };
  return result;
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
  const mapped = Object.entries(attributes).map(([key, value]) =>
    createGVertexProperty(key, createGValue(value))
  );

  const result = {} as Record<string, any>;
  mapped.forEach(prop => {
    result[prop["@value"].label] = [prop];
  });

  return result;
}

export function createGVertexProperty(label: string, gValue: GAnyValue) {
  return {
    "@type": "g:VertexProperty",
    "@value": {
      id: createGInt32(createRandomInteger()),
      label,
      value: gValue,
    },
  } as GVertexProperty;
}

function createGValue(value: EntityPropertyValue): GScalar {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "boolean") {
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

export function createGInt64(value: number): GInt64 {
  return {
    "@type": "g:Int64",
    "@value": value,
  };
}

export function createGInt32(value: number): GInt32 {
  return {
    "@type": "g:Int32",
    "@value": value,
  };
}

export function createGDouble(value: number): GDouble {
  return {
    "@type": "g:Double",
    "@value": value,
  };
}

export function createGDate(value: Date): GDate {
  return {
    "@type": "g:Date",
    "@value": value.getTime(),
  };
}
