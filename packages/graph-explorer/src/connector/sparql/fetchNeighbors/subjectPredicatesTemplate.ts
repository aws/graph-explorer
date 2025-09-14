import { query } from "@/utils";
import { type SPARQLNeighborsPredicatesRequest } from "../types";
import { idParam } from "../idParam";

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
  const subjectUriTemplate = subjectURIs.length
    ? `VALUES ?subject { ${subjectURIs.map(idParam).join(" ")} }`
    : "";

  return query`
    # Fetch all predicates and their direction of a pairs of subjects
    SELECT ?subject ?subjectClass ?predToSubject ?predFromSubject {
      BIND(${idParam(resourceURI)} AS ?argument)
      ${subjectUriTemplate}
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
