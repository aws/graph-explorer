import {
  type ResultVertex,
  type ResultEntity,
  type ResultEdge,
  type ScalarValue,
  createTypedValue,
} from "@/connector/entities";
import type {
  GAnyValue,
  GBulkSet,
  GDate,
  GDouble,
  GEdge,
  GInt32,
  GInt64,
  GList,
  GMap,
  GPath,
  GProperty,
  GScalar,
  GSet,
  GType,
  GVertex,
  GVertexProperty,
} from "@/connector/gremlin/types";
import {
  type Edge,
  type EdgeId,
  type EntityPropertyValue,
  getRawId,
  type Vertex,
  type VertexId,
} from "@/core";
import { createRandomInteger } from "@shared/utils/testing";

export function createGremlinResponseFromVertices(...vertices: ResultVertex[]) {
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

export function createGSet(items: GAnyValue[]): GSet {
  return {
    "@type": "g:Set",
    "@value": items,
  };
}

export function createGBulkSet<Value extends EntityPropertyValue | GAnyValue>(
  values: Record<string, Value>
) {
  const mapItems: GAnyValue[] = [];
  for (const [key, value] of Object.entries(values)) {
    mapItems.push(key);

    if (
      value === null ||
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
  const result: GBulkSet = {
    "@type": "g:BulkSet",
    "@value": mapItems,
  };
  return result;
}

export function createGMap<Value extends EntityPropertyValue | GAnyValue>(
  values: Record<string, Value>
): GMap {
  const mapItems: GAnyValue[] = [];
  for (const [key, value] of Object.entries(values)) {
    mapItems.push(key);

    if (
      value === null ||
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

export function createGPath(entities: ResultEntity[]): GPath {
  const gSetValues = entities
    .map(e => {
      const label: GSet = {
        "@type": "g:Set",
        "@value": e.name ? [e.name] : [],
      };

      if (e.entityType === "vertex") {
        return { label, object: createGVertex(e) };
      } else if (e.entityType === "edge") {
        return { label, object: createGEdge(e) };
      } else if (e.entityType === "scalar") {
        return { label, object: createGValue(e.value) };
      }

      return null;
    })
    .filter(e => e != null);

  return {
    "@type": "g:Path",
    "@value": {
      labels: createGList(gSetValues.map(g => g.label)),
      objects: createGList(gSetValues.map(g => g.object)),
    },
  };
}

export function createGVertex(vertex: ResultVertex): GVertex {
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

  const properties =
    vertex.attributes != null
      ? createGVertexProperties(vertex.attributes)
      : undefined;

  return {
    "@type": "g:Vertex",
    "@value": {
      id,
      label: vertex.types.join("::"),
      properties,
    },
  };
}

export function createGEdge(edge: ResultEdge): GEdge {
  const properties =
    edge.attributes != null ? createGProperties(edge.attributes) : undefined;

  return {
    "@type": "g:Edge",
    "@value": {
      id: createIdValue(edge.id),
      label: edge.type,
      inV: createIdValue(edge.targetId),
      outV: createIdValue(edge.sourceId),
      properties,
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

export function createGValue(value: ScalarValue): GScalar {
  const typedValue = createTypedValue(value);

  switch (typedValue.type) {
    case "string":
    case "boolean":
      return typedValue.value;
    case "number":
      return createGInt64(typedValue.value);
    case "date":
      return createGDate(typedValue.value);
    case "null":
      return null as any;
  }
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

export function createGType(name: string): GType {
  return {
    "@type": "g:T" as const,
    "@value": name,
  };
}
