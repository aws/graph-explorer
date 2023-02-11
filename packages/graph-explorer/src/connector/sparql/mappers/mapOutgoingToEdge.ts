import { Edge } from "../../../@types/entities";
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
    data: {
      id: `${resourceURI}-[${result.predToSubject.value}]->${result.subject.value}`,
      type: result.predToSubject.value,
      source: resourceURI,
      sourceType: resourceClass,
      target: result.subject.value,
      targetType: result.subjectClass.value,
      attributes: {},
    },
  };
};

export default mapOutgoingToEdge;
