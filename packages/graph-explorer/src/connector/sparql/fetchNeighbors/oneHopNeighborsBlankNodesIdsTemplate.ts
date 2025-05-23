import { query } from "@/utils";
import { SPARQLNeighborsRequest } from "../types";
import { getFilters, getSubjectClasses } from "./helpers";
import { idParam } from "../idParam";
import { getLimit } from "../getLimit";

/**
 * Generate a template with the same constraints that oneHopNeighborsTemplate
 * but returning only the blank node ID to be used as sub-query of another queries.
 *
 * @see oneHopNeighborsTemplate
 */
export default function oneHopNeighborsBlankNodesIdsTemplate({
  resourceURI,
  subjectClasses = [],
  filterCriteria = [],
  limit = 0,
  offset = 0,
}: SPARQLNeighborsRequest) {
  return query`
    # Sub-query to fetch blank node ids for one hop neighbors
    SELECT DISTINCT (?subject AS ?bNode) {
      BIND(${idParam(resourceURI)} AS ?argument)
      ${getSubjectClasses(subjectClasses)}
      {
        ?argument ?pToSubject ?subject.
        ?subject a         ?subjectClass;
                 ?sPred    ?sValue .
        ${getFilters(filterCriteria)}
      }
      UNION
      {
        ?subject ?pFromSubject ?argument;
                 a         ?subjectClass;
                 ?sPred    ?sValue .
       ${getFilters(filterCriteria)}
      }
      FILTER(isBlank(?subject))
    }
    ${getLimit(limit, offset)}
  `;
}
