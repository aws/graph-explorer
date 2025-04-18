import { createEdge, Vertex, VertexId } from "@/core";
import { RawValue } from "../types";
import { createRdfEdgeId } from "../createRdfEdgeId";

export type OutgoingPredicate = {
  subject: RawValue;
  subjectClass: RawValue;
  predToSubject: RawValue;
};

export default function mapOutgoingToEdge(
  resourceURI: VertexId,
  resourceClasses: Vertex["types"],
  result: OutgoingPredicate
) {
  const targetUri = result.subject.value;
  const predicate = result.predToSubject.value;
  return createEdge({
    id: createRdfEdgeId(resourceURI, predicate, targetUri),
    type: predicate,
    source: {
      id: resourceURI,
      types: resourceClasses,
    },
    target: {
      id: targetUri,
      types: [result.subjectClass.value],
    },
    // Ensure this edge is not a fragment since SPARQL edges can not have attributes
    attributes: {},
  });
}
