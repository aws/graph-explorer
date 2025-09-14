import { createEdge, type VertexId } from "@/core";
import { type RawValue } from "../types";
import { createRdfEdgeId } from "../createRdfEdgeId";

export type OutgoingPredicate = {
  subject: RawValue;
  subjectClass: RawValue;
  predToSubject: RawValue;
};

export default function mapOutgoingToEdge(
  resourceURI: VertexId,
  result: OutgoingPredicate
) {
  const targetUri = result.subject.value;
  const predicate = result.predToSubject.value;
  return createEdge({
    id: createRdfEdgeId(resourceURI, predicate, targetUri),
    type: predicate,
    sourceId: resourceURI,
    targetId: targetUri,
    // Ensure this edge is not a fragment since SPARQL edges can not have attributes
    attributes: {},
  });
}
