import { Edge } from "./edge";
import { createVertexId, createEdgeId } from "./entityIdType";
import { EntityPropertyValue, EntityProperties, EntityRawId } from "./shared";
import { Vertex } from "./vertex";

type CreateEntityAttributeOptions =
  | Map<string, EntityPropertyValue>
  | EntityProperties;

type CreateVertexOptions = {
  id: EntityRawId;
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
  id: EntityRawId;
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
): EntityProperties {
  if (attributes instanceof Map) {
    return attributes.entries().reduce((prev, [key, value]) => {
      prev[key] = value;
      return prev;
    }, {} as EntityProperties);
  }

  return attributes;
}
