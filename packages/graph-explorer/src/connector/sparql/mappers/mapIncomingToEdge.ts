import { Edge } from "../../../@types/entities";
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
    data: {
      id: `${result.subject.value}-[${result.predFromSubject.value}]->${resourceURI}`,
      type: result.predFromSubject.value,
      source: result.subject.value,
      sourceType: result.subjectClass.value,
      target: resourceURI,
      targetType: resourceClass,
      attributes: {},
    },
  };
};

export default mapIncomingToEdge;

export const isIncomingPredicate = (
  result: any
): result is IncomingPredicate => {
  return !!result.predFromSubject;
};
