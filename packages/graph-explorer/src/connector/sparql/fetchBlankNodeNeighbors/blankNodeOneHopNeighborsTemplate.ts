import { query } from "@/utils";
import { idParam } from "../idParam";
import { rdfTypeUri } from "../types";

/**
 * Fetch all neighbors and their predicates, values, and classes
 * given a blank node sub-query.
 *
 * @see oneHopNeighborsTemplate
 */
export default function blankNodeOneHopNeighborsTemplate(subQuery: string) {
  const rdfTypeUriTemplate = idParam(rdfTypeUri);

  return query`
    # Fetch all neighbors and their predicates, values, and classes for blank node
    SELECT DISTINCT ?subject ?predicate ?object
    WHERE {
      # Find the blank nodes using the original search or expand query
      {
        ${subQuery}
      }

      # Get all neighbors for the blank nodes
      {
        SELECT DISTINCT ?bNode ?neighbor 
        WHERE {
          {
            ?neighbor ?p ?bNode .
            ?neighbor a ?class .
            FILTER(!isLiteral(?neighbor) && ?p != ${rdfTypeUriTemplate})
          } 
          UNION 
          {
            ?bNode ?p ?neighbor .
            ?neighbor a ?class .
            FILTER(!isLiteral(?neighbor) && ?p != ${rdfTypeUriTemplate})
          }
        }
      }

      # Now get the data for these specific neighbors
      {
        # Connection predicate
        ?neighbor ?predicate ?bNode .
        BIND(?neighbor as ?subject) 
        BIND(?bNode as ?object)
      } UNION {
        # Connection predicate
        ?bNode ?predicate ?neighbor .
        BIND(?bNode as ?subject) 
        BIND(?neighbor as ?object)
      } UNION {
        # Neighbor properties
        ?neighbor ?predicate ?object .
        FILTER(isLiteral(?object) || ?predicate = ${rdfTypeUriTemplate})
        BIND(?neighbor as ?subject)
      }
    }
  `;
}
