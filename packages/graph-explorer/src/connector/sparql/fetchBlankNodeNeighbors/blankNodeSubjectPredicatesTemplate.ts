import { query } from "@/utils";
import { type SPARQLBlankNodeNeighborsPredicatesRequest } from "../types";
import { idParam } from "../idParam";

/**
 * Fetch all predicates and their direction of a pairs of subjects
 * given a blank node sub-query
 *
 * @see subjectPredicatesTemplate
 */
const blankNodeSubjectPredicatesTemplate = ({
  subQuery,
  subjectURIs = [],
}: SPARQLBlankNodeNeighborsPredicatesRequest): string => {
  const getSubjectURIs = () => {
    if (!subjectURIs?.length) {
      return "";
    }

    let classesValues = "VALUES ?subject {";
    subjectURIs.forEach(sURI => {
      classesValues += ` ${idParam(sURI)}`;
    });
    classesValues += "}";
    return classesValues;
  };

  return query`
    # Fetch all predicates and their direction of a pairs of subjects given a blank node sub-query
    SELECT ?subject ?subjectClass ?predToSubject ?predFromSubject {
      ${getSubjectURIs()}
      { 
        ?bNode ?predToSubject ?subject.
        ?subject a ?subjectClass.
      }
      UNION
      { 
        ?subject ?predFromSubject ?bNode;
                 a                ?subjectClass.
      }
      { ${subQuery} }
    }
  `;
};

export default blankNodeSubjectPredicatesTemplate;
