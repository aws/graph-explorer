import { query } from "@/utils";
import { SPARQLNeighborsRequest } from "../types";
import { findNeighborsUsingFilters } from "./oneHopNeighborsTemplate";

/**
 * Generate a template with the same constraints that oneHopNeighborsTemplate
 * but returning only the blank node ID to be used as sub-query of another queries.
 *
 * @see oneHopNeighborsTemplate
 */
export default function oneHopNeighborsBlankNodesIdsTemplate(
  request: SPARQLNeighborsRequest
) {
  return query`
    SELECT DISTINCT (?neighbor AS ?bNode) {
      {
        ${findNeighborsUsingFilters(request)}
      }
      FILTER(isBlank(?neighbor))
    }
  `;
}
