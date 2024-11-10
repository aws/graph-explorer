import { Edge, EdgeId, VertexId } from "@/@types/entities";
import { RawValue } from "../types";

export type OutgoingPredicate = {
  subject: RawValue;
  subjectClass: RawValue;
  predToSubject: RawValue;
};

const mapOutgoingToEdge = (
  resourceURI: string,
  resourceClass: string,
  result: OutgoingPredicate
): Edge => {
  return {
    entityType: "edge",
    id: `${resourceURI}-[${result.predToSubject.value}]->${result.subject.value}` as EdgeId,
    type: result.predToSubject.value,
    source: resourceURI as VertexId,
    sourceType: resourceClass,
    target: result.subject.value as VertexId,
    targetType: result.subjectClass.value,
    attributes: {},
  };
};

export default mapOutgoingToEdge;
