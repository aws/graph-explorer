import { createVertexId, Edge, Vertex, VertexId } from "@/core";
import { RawValue } from "../types";
import { createRdfEdgeId } from "../createRdfEdgeId";

export type IncomingPredicate = {
  subject: RawValue;
  subjectClass: RawValue;
  predFromSubject: RawValue;
};

const mapIncomingToEdge = (
  resourceURI: VertexId,
  resourceClasses: Vertex["types"],
  result: IncomingPredicate
): Edge => {
  const sourceUri = result.subject.value;
  const predicate = result.predFromSubject.value;

  return {
    entityType: "edge",
    id: createRdfEdgeId(sourceUri, predicate, resourceURI),
    type: predicate,
    source: createVertexId(sourceUri),
    sourceTypes: [result.subjectClass.value],
    target: resourceURI,
    targetTypes: resourceClasses,
    attributes: {},
  };
};

export default mapIncomingToEdge;

export const isIncomingPredicate = (
  result: any
): result is IncomingPredicate => {
  return !!result.predFromSubject;
};
