import type { AttributeFilter } from "@/connector/useGEFetchTypes";

import { query } from "@/utils";

import {
  getLimit,
  getNeighborsFilter,
  getSubjectClasses,
} from "../filterHelpers";
import { fragment } from "../fragments";
import { rdfTypeUri, type SPARQLNeighborsRequest } from "../types";

/**
 * Creates a SPARQL query that will find all neighbors for the given resource URI and search filters.
 *
 * The result will include the following in standard triple or quad form:
 *
 * - Neighbor literals
 * - Neighbor class
 * - Predicates from source to neighbor
 * - Predicates from neighbor to source
 *
 * @example
 * resourceURI = "http://www.example.com/soccer/resource#EPL"
 * subjectClasses = [
 *   "http://www.example.com/soccer/ontology/Team",
 * ]
 * attributeFilters = [
 *   { name: "http://www.example.com/soccer/ontology/teamName", value: "Arsenal" },
 *   { name: "http://www.example.com/soccer/ontology/nickname", value: "Gunners" },
 * ]
 * limit = 2
 *
 * SELECT DISTINCT ?subject ?predicate ?object
 * WHERE {
 *   {
 *     SELECT DISTINCT ?neighbor
 *     WHERE {
 *       BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
 *       {
 *         ?neighbor ?predicate ?resource .
 *         OPTIONAL { ?neighbor a ?class } .
 *
 *         FILTER(
 *           ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
 *           !isLiteral(?neighbor)
 *         )
 *         FILTER (?class IN (
 *           <http://www.example.com/soccer/ontology/Team>
 *         ))
 *       }
 *       UNION
 *       {
 *         ?resource ?predicate ?neighbor .
 *         OPTIONAL { ?neighbor a ?class } .
 *
 *         FILTER(
 *           ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
 *           !isLiteral(?neighbor)
 *         )
 *         FILTER (?class IN (
 *           <http://www.example.com/soccer/ontology/Team>
 *         ))
 *       }
 *       ?neighbor ?pValue ?object .
 *       FILTER(
 *         isLiteral(?object) && (
 *           (?pValue=<http://www.example.com/soccer/ontology/teamName> && regex(str(?object), "Arsenal", "i")) ||
 *           (?pValue=<http://www.example.com/soccer/ontology/nickname> && regex(str(?object), "Gunners", "i"))
 *         )
 *       )
 *     }
 *     LIMIT 2
 *   }
 *   {
 *     BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
 *     ?neighbor ?pToSource ?resource
 *     BIND(?neighbor as ?subject)
 *     BIND(?pToSource as ?predicate)
 *     BIND(?resource as ?object)
 *   }
 *   UNION
 *   {
 *     BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
 *     ?resource ?pFromSource ?neighbor
 *     BIND(?neighbor as ?object)
 *     BIND(?pFromSource as ?predicate)
 *     BIND(?resource as ?subject)
 *   }
 *   UNION
 *   {
 *     ?neighbor ?predicate ?object
 *     FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
 *     BIND(?neighbor as ?subject)
 *   }
 *   UNION
 *   {
 *     BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
 *     ?resource ?predicate ?object
 *     FILTER(?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
 *     BIND(?resource as ?subject)
 *   }
 * }
 */
export function oneHopNeighborsTemplate(
  request: SPARQLNeighborsRequest,
): string {
  const resourceTemplate = fragment.iri(request.resourceURI);
  const rdfTypeUriTemplate = fragment.iri(rdfTypeUri);

  return query`
    # Fetch all neighbors and their predicates, values, and classes
    SELECT DISTINCT ?subject ?predicate ?object
    WHERE {
      {
        ${findNeighborsUsingFilters(request)}
      }

      # Using the ?neighbor gathered above we can start getting
      # the information we are really interested in
      #
      # - predicate to source from neighbor
      # - predicate from source to neighbor
      # - neighbor class
      # - neighbor values

      {
        # Executed as a subquery to workaround a query optimization issue
        # [Original Fix PR #942](https://github.com/aws/graph-explorer/pull/942)
        # [Regression PR #1065](https://github.com/aws/graph-explorer/pull/1065)
        # [Second fix PR #1402](https://github.com/aws/graph-explorer/pull/1402)
        
        SELECT * 
        WHERE {
          {
            # Incoming connection predicate
            BIND(${resourceTemplate} AS ?resource)
            ?neighbor ?pToSource ?resource
            BIND(?neighbor as ?subject)
            BIND(?pToSource as ?predicate)
            BIND(?resource as ?object)
          }
          UNION
          {
            # Outgoing connection predicate
            BIND(${resourceTemplate} AS ?resource)
            ?resource ?pFromSource ?neighbor
            BIND(?neighbor as ?object)
            BIND(?pFromSource as ?predicate)
            BIND(?resource as ?subject)
          }
          UNION
          {
            # Values and types
            ?neighbor ?predicate ?object
            FILTER(isLiteral(?object) || ?predicate = ${rdfTypeUriTemplate})
            BIND(?neighbor as ?subject)
          }
        }
      }
    }
  `;
}

/**
 * Creates a SPARQL query that uses search expand neighbors filters to find neighbors matching the filters.
 *
 * This is used by the neighbor expansion query and as the subquery in future blank node queries.
 */
export function findNeighborsUsingFilters({
  resourceURI,
  subjectClasses = [],
  attributeFilters = [],
  excludedVertices = new Set(),
  limit = 0,
}: SPARQLNeighborsRequest): string {
  const resourceTemplate = fragment.iri(resourceURI);

  return query`
    # This sub-query will give us all unique neighbors within the given limit
    SELECT DISTINCT ?neighbor
    WHERE {
      BIND(${resourceTemplate} AS ?resource)
      {
        # Incoming neighbors
        ?neighbor ?predicate ?resource . 
        OPTIONAL { ?neighbor a ?class } .
        ${getNeighborsFilter(excludedVertices)}
        ${getSubjectClasses(subjectClasses)}
      }
      UNION
      {
        # Outgoing neighbors
        ?resource ?predicate ?neighbor . 
        OPTIONAL { ?neighbor a ?class } .
        ${getNeighborsFilter(excludedVertices)}
        ${getSubjectClasses(subjectClasses)}
      }
      ${getFilterTemplate(attributeFilters)}
    }
    ${getLimit(limit)}
  `;
}

/**
 * Creates a filter template for the given attribute filters.
 *
 * The ?pValue must equal the filter's attribute name and the ?object must contain the filter's value.
 */
function getFilterTemplate(attributeFilters: AttributeFilter[]) {
  const hasFilters = attributeFilters.length > 0;

  const createFilterTemplate = (filter: AttributeFilter) =>
    `(?pValue=${fragment.iri(filter.name)} && regex(str(?object), "${filter.value}", "i"))`;

  return hasFilters
    ? query`
        ?neighbor ?pValue ?object .
        FILTER(
          isLiteral(?object) && (
            ${attributeFilters.map(createFilterTemplate).join(" ||\n")}
          )
        )
      `
    : "";
}
