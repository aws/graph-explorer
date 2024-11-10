import { Edge, EdgeId, VertexId } from "@/@types/entities";
import { RawValue } from "../types";

export type IncomingPredicate = {
  subject: RawValue;
  subjectClass: RawValue;
  predFromSubject: RawValue;
};

const mapIncomingToEdge = (
  resourceURI: string,
  resourceClass: string,
  result: IncomingPredicate
): Edge => {
  return {
    entityType: "edge",
    id: `${result.subject.value}-[${result.predFromSubject.value}]->${resourceURI}` as EdgeId,
    type: result.predFromSubject.value,
    source: result.subject.value as VertexId,
    sourceType: result.subjectClass.value,
    target: resourceURI as VertexId,
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
