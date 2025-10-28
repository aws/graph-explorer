import {
  createResultEdge,
  createResultVertex,
  type ResultEdge,
  type ResultVertex,
} from "@/connector/entities";
import { rdfTypeUri, type SparqlQuadBinding } from "../types";
import { createRdfEdgeId } from "../createRdfEdgeId";
import type { EntityProperties } from "@/core/entities";
import { mapSparqlValueToScalar } from "./mapSparqlValueToScalar";

/** Internal type to support creation of vertex result one binding at a time. */
type VertexDraft = {
  id: string;
  types?: string[];
  attributes?: EntityProperties;
  isBlankNode: boolean;
};

export function mapQuadToEntities(bindings: SparqlQuadBinding[]) {
  const edges: ResultEdge[] = [];
  const vertexDrafts: Map<string, VertexDraft> = new Map();

  // Separate quads into edges and vertex drafts
  for (const binding of bindings) {
    if (isEdgeBinding(binding)) {
      edges.push(mapToEdgeResult(binding));
    } else {
      const draft = createVertexDraft(binding);
      const existing = vertexDrafts.get(draft.id);
      vertexDrafts.set(draft.id, mergeVertexDrafts(existing, draft));
    }
  }

  // Map all drafts to actual Vertex objects
  const vertices: ResultVertex[] = [];
  for (const draft of vertexDrafts.values()) {
    vertices.push(
      createResultVertex({
        id: draft.id,
        types: draft.types,
        attributes: draft.attributes,
        isBlankNode: draft.isBlankNode,
      })
    );
  }

  return {
    vertices,
    edges,
  };
}

/** Creates a vertex draft from a single sparql binding. */
function createVertexDraft(binding: SparqlQuadBinding) {
  const id = binding.subject.value;
  const isBlankNode = binding.subject.type === "bnode";

  if (isVertexTypeBinding(binding)) {
    return {
      id,
      isBlankNode,
      types: [binding.object.value],
    };
  } else {
    return {
      id,
      isBlankNode,
      attributes: {
        [binding.predicate.value]: mapSparqlValueToScalar(binding.object),
      },
    };
  }
}

/** Merges the existing draft and the new draft together. */
function mergeVertexDrafts(
  existing: VertexDraft | undefined,
  draft: VertexDraft
): VertexDraft {
  if (!existing) {
    return draft;
  }

  return {
    ...existing,
    // Ensure no duplicate types by using Set
    types: draft.types
      ? Array.from(new Set([...(existing.types ?? []), ...draft.types]))
      : existing.types,
    attributes: draft.attributes
      ? {
          ...existing.attributes,
          ...draft.attributes,
        }
      : existing.attributes,
    // If any draft is ever true, then consider this vertex to be a blank node
    isBlankNode: existing.isBlankNode || draft.isBlankNode,
  };
}

function mapToEdgeResult(binding: SparqlQuadBinding) {
  // Create RDF edge ID using the standard format
  const edgeId = createRdfEdgeId(
    binding.subject.value,
    binding.predicate.value,
    binding.object.value
  );

  return createResultEdge({
    id: edgeId,
    sourceId: binding.subject.value,
    targetId: binding.object.value,
    type: binding.predicate.value,
    // RDF edges don't have additional attributes beyond the predicate
    attributes: {},
  });
}

function isVertexTypeBinding(binding: SparqlQuadBinding) {
  return (
    binding.predicate.value.toLowerCase() === rdfTypeUri.toLowerCase() &&
    binding.object.type === "uri"
  );
}

function isEdgeBinding(binding: SparqlQuadBinding) {
  // Subject is resource or bnode
  // Object is resource or bnode
  // Predicate is a URI, but not the rdf:type URI
  return (
    !isVertexTypeBinding(binding) &&
    binding.predicate.type === "uri" &&
    (binding.subject.type === "uri" || binding.subject.type === "bnode") &&
    (binding.object.type === "uri" || binding.object.type === "bnode")
  );
}
