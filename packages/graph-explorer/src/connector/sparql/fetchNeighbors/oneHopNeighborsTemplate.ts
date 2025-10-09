import { query } from "@/utils";
import { idParam } from "../idParam";
import { rdfTypeUri, SPARQLNeighborsRequest } from "../types";
import { getLimit } from "../getLimit";

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
 * filterCriteria = [
 *   { predicate: "http://www.example.com/soccer/ontology/teamName", object: "Arsenal" },
 *   { predicate: "http://www.example.com/soccer/ontology/nickname", object: "Gunners" },
 * ]
 * limit = 2
 * offset = 0
 *
 * SELECT DISTINCT ?subject ?predicate ?object
 * WHERE {
 *   {
 *     SELECT DISTINCT ?neighbor
 *     WHERE {
 *       BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
 *       VALUES ?class { <http://www.example.com/soccer/ontology/Team> }
 *       {
 *         ?neighbor ?predicate ?resource .
 *         ?neighbor a ?class .
 *         FILTER(
 *           ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
 *           !isLiteral(?neighbor)
 *         )
 *       }
 *       UNION
 *       {
 *         ?resource ?predicate ?neighbor .
 *         ?neighbor a ?class .
 *         FILTER(
 *           ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
 *           !isLiteral(?neighbor)
 *         )
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
  request: SPARQLNeighborsRequest
): string {
  const resourceTemplate = idParam(request.resourceURI);
  const rdfTypeUriTemplate = idParam(rdfTypeUri);

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
      UNION
      {
        # Source types
        BIND(${resourceTemplate} AS ?resource)
        ?resource ?predicate ?object
        FILTER(?predicate = ${rdfTypeUriTemplate})
        BIND(?resource as ?subject)
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
  filterCriteria = [],
  excludedVertices = new Set(),
  limit = 0,
  offset = 0,
}: SPARQLNeighborsRequest): string {
  const resourceTemplate = idParam(resourceURI);

  // templates for filtering by value
  const hasFilters = filterCriteria.length > 0;
  const filterCriteriaTemplate = filterCriteria
    .map(
      c =>
        `(?pValue=${idParam(c.predicate)} && regex(str(?object), "${c.object}", "i"))`
    )
    .join(" ||\n");
  const filterTemplate = hasFilters
    ? query`
        FILTER(
          isLiteral(?object) && (
            ${filterCriteriaTemplate}
          )
        )
      `
    : "";
  const valueBindingTemplate = hasFilters ? `?neighbor ?pValue ?object .` : "";

  // templates for filtering by class
  const subjectClassesTemplate = subjectClasses.length
    ? `VALUES ?class { ${subjectClasses.map(idParam).join(" ")} }`
    : "";

  const limitTemplate = getLimit(limit, offset);
  const rdfTypeUriTemplate = idParam(rdfTypeUri);

  const neighborFilters = [
    `?predicate != ${rdfTypeUriTemplate}`,
    `!isLiteral(?neighbor)`,
    excludedVertices.size > 0
      ? query`
      ?neighbor NOT IN (
        ${excludedVertices.values().map(idParam).toArray().join(", \n")}
      )
    `
      : null,
  ];
  const neighborFilterTemplate = query`
    FILTER(
      ${neighborFilters.filter(item => item != null).join(" &&\n")}
    )
  `;

  return query`
    # This sub-query will give us all unique neighbors within the given limit
    SELECT DISTINCT ?neighbor
    WHERE {
      BIND(${resourceTemplate} AS ?resource)
      ${subjectClassesTemplate}
      {
        # Incoming neighbors
        ?neighbor ?predicate ?resource . 
        
        # Get the neighbor's class
        ?neighbor a ?class .

        ${neighborFilterTemplate}
      }
      UNION
      {
        # Outgoing neighbors
        ?resource ?predicate ?neighbor . 
        
        # Get the neighbor's class
        ?neighbor a ?class .

        ${neighborFilterTemplate}
      }
      ${valueBindingTemplate}
      ${filterTemplate}
    }
    ${limitTemplate}
  `;
}
