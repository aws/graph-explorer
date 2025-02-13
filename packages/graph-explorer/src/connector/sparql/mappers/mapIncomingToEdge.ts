import { createVertexId, Edge, VertexId } from "@/core";
import { RawValue } from "../types";
import { createRdfEdgeId } from "../createRdfEdgeId";

export type IncomingPredicate = {
  subject: RawValue;
  subjectClass: RawValue;
  predFromSubject: RawValue;
};

const mapIncomingToEdge = (
  resourceURI: VertexId,
  resourceClass: string,
  result: IncomingPredicate
): Edge => {
  const sourceUri = result.subject.value;
  const predicate = result.predFromSubject.value;

  return {
    entityType: "edge",
    id: createRdfEdgeId(sourceUri, predicate, resourceURI),
    type: predicate,
    source: createVertexId(sourceUri),
    sourceType: result.subjectClass.value,
    target: resourceURI,
    targetType: resourceClass,
    attributes: {},
  };
};

export default mapIncomingToEdge;

export const isIncomingPredicate = (
  result: any
): result is IncomingPredicate => {
  return !!result.predFromSubject;
};
