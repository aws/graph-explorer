import { RawValue, rdfTypeUri } from "../types";
import {
  createEdge,
  createVertex,
  Edge,
  Entities,
  EntityProperties,
} from "@/core";
import { createRdfEdgeId } from "../createRdfEdgeId";
import { mapAttributeValue } from "../mappers/mapAttributeValue";

export type RawOneHopNeighborsResponse = {
  results: {
    bindings: Array<{
      subject: RawValue;
      p: RawValue;
      value: RawValue;
    }>;
  };
};
type Bindings = RawOneHopNeighborsResponse["results"]["bindings"];

type VertexDraft = {
  id: string;
  types?: string[];
  attributes?: EntityProperties;
  isBlankNode: boolean;
};

export function mapToResults(bindings: Bindings): Entities {
  const edges: Edge[] = [];
  const vertexDrafts: Map<string, VertexDraft> = new Map();

  /** Updates the existing draft by merging data, or inserts a new entry. */
  const updateDraft = (draft: VertexDraft) => {
    const existing = vertexDrafts.get(draft.id);
    if (existing) {
      vertexDrafts.set(draft.id, {
        ...existing,
        types: [...(existing.types ?? []), ...(draft.types ?? [])],
        attributes: {
          ...existing.attributes,
          ...draft.attributes,
        },
        isBlankNode: draft.isBlankNode,
      });
    } else {
      vertexDrafts.set(draft.id, draft);
    }
  };

  for (const binding of bindings) {
    const { subject, p, value } = binding;

    if (
      (subject.type === "uri" || subject.type === "bnode") &&
      (value.type === "uri" || value.type === "bnode") &&
      p.value !== rdfTypeUri
    ) {
      // Map edge bindings directly to an edge
      const edgeId = createRdfEdgeId(subject.value, p.value, value.value);
      const edge = createEdge({
        id: edgeId,
        type: p.value,
        sourceId: subject.value,
        targetId: value.value,
      });

      edges.push(edge);
    } else {
      // Aggregate resource bindings in to a VertexDraft
      const isBlankNode = subject.type === "bnode";
      if (p.value === rdfTypeUri) {
        // Set the type
        updateDraft({
          id: subject.value,
          types: [value.value],
          isBlankNode,
        });
      } else {
        // Set property values
        updateDraft({
          id: subject.value,
          attributes: {
            [p.value]: mapAttributeValue(value),
          },
          isBlankNode,
        });
      }
    }
  }

  // Map all drafts to actual Vertex objects
  const vertices = Array.from(vertexDrafts.values()).map(draft =>
    createVertex({
      id: draft.id,
      types: draft.types,
      attributes: draft.attributes ?? {},
      isBlankNode: draft.isBlankNode,
    })
  );

  return {
    vertices,
    edges,
  };
}
