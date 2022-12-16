import { SPARQLNeighborsPredicatesRequest } from "../types";

/**
 * Fetch all predicates and their direction of a pairs of subjects
 *
 * @example
 * resourceURI = "http://kelvinlawrence.net/air-routes/resource/1"
 * subjectURIs = [
 *   "http://kelvinlawrence.net/air-routes/resource/3",
 *   "http://kelvinlawrence.net/air-routes/resource/11",
 * ]
 *
 * SELECT ?subject ?subjectClass ?predToSubject ?predFromSubject {
 *   BIND(<http://kelvinlawrence.net/air-routes/resource/1> AS ?argument)
 *   VALUES ?subject {
 *    <http://kelvinlawrence.net/air-routes/resource/3>
 *    <http://kelvinlawrence.net/air-routes/resource/11>
 *   }
 *   {
 *     ?argument ?predToSubject ?subject.
 *     ?subject a ?subjectClass.
 *   }
 *   UNION
 *   {
 *     ?subject ?predFromSubject ?argument;
 *              a                ?subjectClass.
 *   }
 * }
 */
const subjectPredicatesTemplate = ({
  resourceURI,
  subjectURIs = [],
}: SPARQLNeighborsPredicatesRequest): string => {
  const getSubjectURIs = () => {
    if (!subjectURIs?.length) {
      return "";
    }

    let classesValues = "VALUES ?subject {";
    subjectURIs.forEach(sURI => {
      classesValues += ` <${sURI}>`;
    });
    classesValues += "}";
    return classesValues;
  };

  return `
    SELECT ?subject ?subjectClass ?predToSubject ?predFromSubject {
      BIND(<${resourceURI}> AS ?argument)
      ${getSubjectURIs()}
      { 
        ?argument ?predToSubject ?subject.
        ?subject a ?subjectClass.
      }
      UNION
      { 
        ?subject ?predFromSubject ?argument;
                 a                ?subjectClass.
      }
    }
  `;
};

export default subjectPredicatesTemplate;
