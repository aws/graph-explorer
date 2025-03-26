import { Vertex, Edge } from "./entities";
import { createVertexId, createEdgeId } from "./entityIdType";

type CreateEntityAttributeOptions =
  | Map<string, string | number>
  | Record<string, string | number>;

type CreateVertexOptions = {
  id: string | number;
  types: string[];
  attributes?: CreateEntityAttributeOptions;
  isBlankNode?: boolean;
};

/** Constructs a Vertex instance from the given values. */
export function createVertex(options: CreateVertexOptions): Vertex {
  return {
    entityType: "vertex",
    id: createVertexId(options.id),
    type: options.types[0] ?? "",
    types: options.types,
    attributes:
      options.attributes != null ? createAttributes(options.attributes) : {},
    __isFragment: options.attributes == null,
    __isBlank: options.isBlankNode ?? false,
  };
}

/** Constructs an Edge instance from the given values. */
export function createEdge(options: {
  id: string | number;
  type: string;
  source: CreateVertexOptions;
  target: CreateVertexOptions;
  attributes?: CreateEntityAttributeOptions;
}): Edge {
  const source = createVertex(options.source);
  const target = createVertex(options.target);
  return {
    entityType: "edge",
    id: createEdgeId(options.id),
    type: options.type,
    source: source.id,
    sourceTypes: source.types,
    target: target.id,
    targetTypes: target.types,
    attributes:
      options.attributes != null ? createAttributes(options.attributes) : {},
    __isFragment: options.attributes == null,
  };
}

function createAttributes(
  attributes: CreateEntityAttributeOptions
): Vertex["attributes"] {
  if (attributes instanceof Map) {
    return attributes.entries().reduce(
      (prev, [key, value]) => {
        prev[key] = value;
        return prev;
      },
      {} as Vertex["attributes"]
    );
  }

  return attributes;
}
