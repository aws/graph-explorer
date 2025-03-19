import { createVertexId, Edge, Vertex, VertexId } from "@/core";
import { RawValue } from "../types";
import { createRdfEdgeId } from "../createRdfEdgeId";

export type OutgoingPredicate = {
  subject: RawValue;
  subjectClass: RawValue;
  predToSubject: RawValue;
};

const mapOutgoingToEdge = (
  resourceURI: VertexId,
  resourceClasses: Vertex["types"],
  result: OutgoingPredicate
): Edge => {
  const targetUri = result.subject.value;
  const predicate = result.predToSubject.value;
  return {
    entityType: "edge",
    id: createRdfEdgeId(resourceURI, predicate, targetUri),
    type: predicate,
    source: resourceURI,
    sourceTypes: resourceClasses,
    target: createVertexId(targetUri),
    targetTypes: [result.subjectClass.value],
    attributes: {},
  };
};

export default mapOutgoingToEdge;
