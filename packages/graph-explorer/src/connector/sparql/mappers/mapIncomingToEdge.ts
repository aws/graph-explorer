import { createEdge, Vertex, VertexId } from "@/core";
import { RawValue } from "../types";
import { createRdfEdgeId } from "../createRdfEdgeId";

export type IncomingPredicate = {
  subject: RawValue;
  subjectClass: RawValue;
  predFromSubject: RawValue;
};

export default function mapIncomingToEdge(
  resourceURI: VertexId,
  resourceClasses: Vertex["types"],
  result: IncomingPredicate
) {
  const sourceUri = result.subject.value;
  const predicate = result.predFromSubject.value;

  return createEdge({
    id: createRdfEdgeId(sourceUri, predicate, resourceURI),
    type: predicate,
    source: {
      id: sourceUri,
      types: [result.subjectClass.value],
    },
    target: {
      id: resourceURI,
      types: resourceClasses,
    },
    // Ensure this edge is not a fragment since SPARQL edges can not have attributes
    attributes: {},
  });
}

export function isIncomingPredicate(result: any): result is IncomingPredicate {
  return !!result.predFromSubject;
}
