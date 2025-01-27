import { createEdgeId, createVertexId, Edge, getRawId, VertexId } from "@/core";
import { RawValue } from "../types";

export type OutgoingPredicate = {
  subject: RawValue;
  subjectClass: RawValue;
  predToSubject: RawValue;
};

const mapOutgoingToEdge = (
  resourceURI: VertexId,
  resourceClass: string,
  result: OutgoingPredicate
): Edge => {
  const targetUri = result.subject.value;
  const predicate = result.predToSubject.value;
  return {
    entityType: "edge",
    id: createEdgeId(`${getRawId(resourceURI)}-[${predicate}]->${targetUri}`),
    idType: "string",
    type: predicate,
    source: resourceURI,
    sourceType: resourceClass,
    target: createVertexId(targetUri),
    targetType: result.subjectClass.value,
    attributes: {},
  };
};

export default mapOutgoingToEdge;
