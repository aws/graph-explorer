import { query } from "@/utils";

import { getNeighborsFilter } from "../filterHelpers";
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
            ?neighbor ?predicate ?bNode .
            ${getNeighborsFilter()}
          } 
          UNION 
          {
            ?bNode ?predicate ?neighbor .
            ${getNeighborsFilter()}
          }
        }
      }

      # Now get the data for these specific neighbors
      {
        # Executed as a subquery to workaround a query optimization issue
        # [Original Fix PR #942](https://github.com/aws/graph-explorer/pull/942)
        # [Regression PR #1065](https://github.com/aws/graph-explorer/pull/1065)
        # [Second fix PR #1402](https://github.com/aws/graph-explorer/pull/1402)
      
        SELECT *
        WHERE {
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
      }
    }
  `;
}
