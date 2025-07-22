import { query } from "@/utils";
import { idParam } from "../idParam";
import { rdfTypeUri, SPARQLNeighborsRequest } from "../types";
import { getLimit } from "../getLimit";

/**
 * Fetch all neighbors and their predicates, values, and classes.
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
 * SELECT DISTINCT ?subject ?p ?value
 * WHERE {
 *   {
 *     SELECT DISTINCT ?neighbor
 *     WHERE {
 *       BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
 *       VALUES ?class { <http://www.example.com/soccer/ontology/Team> }
 *       {
 *         ?neighbor ?pIncoming ?resource .
 *         ?neighbor a ?class .
 *         FILTER NOT EXISTS { ?anySubject a ?neighbor }
 *       }
 *       UNION
 *       {
 *         ?resource ?pOutgoing ?neighbor .
 *         ?neighbor a ?class .
 *         FILTER NOT EXISTS { ?anySubject a ?neighbor }
 *       }
 *       ?neighbor ?pValue ?value .
 *       FILTER(
 *         isLiteral(?value) && (
 *           (?pValue=<http://www.example.com/soccer/ontology/teamName> && regex(str(?value), "Arsenal", "i")) ||
 *           (?pValue=<http://www.example.com/soccer/ontology/nickname> && regex(str(?value), "Gunners", "i"))
 *         )
 *       )
 *     }
 *     ORDER BY ?neighbor
 *     LIMIT 2
 *   }
 *   {
 *     BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
 *     ?neighbor ?pToSource ?resource
 *     BIND(?neighbor as ?subject)
 *     BIND(?pToSource as ?p)
 *     BIND(?resource as ?value)
 *   }
 *   UNION
 *   {
 *     BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
 *     ?resource ?pFromSource ?neighbor
 *     BIND(?neighbor as ?value)
 *     BIND(?pFromSource as ?p)
 *     BIND(?resource as ?subject)
 *   }
 *   UNION
 *   {
 *     ?neighbor ?p ?value
 *     FILTER(isLiteral(?value) || ?p = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
 *     BIND(?neighbor as ?subject)
 *   }
 *   UNION
 *   {
 *     BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
 *     ?resource ?p ?value
 *     FILTER(?p = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
 *     BIND(?resource as ?subject)
 *   }
 * }
 * ORDER BY ?subject ?p ?value
 */

export function oneHopNeighborsTemplate({
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
        `(?pValue=${idParam(c.predicate)} && regex(str(?value), "${c.object}", "i"))`
    )
    .join(" ||\n");
  const filterTemplate = hasFilters
    ? query`
        FILTER(
          isLiteral(?value) && (
            ${filterCriteriaTemplate}
          )
        )
      `
    : "";
  const valueBindingTemplate = hasFilters ? `?neighbor ?pValue ?value .` : "";

  // templates for filtering by class
  const subjectClassesTemplate = subjectClasses.length
    ? `VALUES ?class { ${subjectClasses.map(idParam).join(" ")} }`
    : "";

  const limitTemplate = getLimit(limit, offset);
  const rdfTypeUriTemplate = idParam(rdfTypeUri);

  // Excluded vertices
  const excludedVerticesTemplate = excludedVertices.size
    ? query`FILTER NOT EXISTS {
        VALUES ?neighbor {
          ${excludedVertices.values().map(idParam).toArray().join(" ")}
        }
      }`
    : "";

  return query`
    # Fetch all neighbors and their predicates, values, and classes
    SELECT DISTINCT ?subject ?p ?value
    WHERE {
      {
        # This sub-query will give us all unique neighbors within the given limit
        SELECT DISTINCT ?neighbor
        WHERE {
          BIND(${resourceTemplate} AS ?resource)
          ${subjectClassesTemplate}
          {
            # Incoming neighbors
            ?neighbor ?pIncoming ?resource . 
            
            # Get the neighbor's class
            ?neighbor a ?class .

            # Remove any classes from the list of neighbors
            FILTER NOT EXISTS { ?anySubject a ?neighbor }
          }
          UNION
          {
            # Outgoing neighbors
            ?resource ?pOutgoing ?neighbor . 
            
            # Get the neighbor's class
            ?neighbor a ?class .

            # Remove any classes from the list of neighbors
            FILTER NOT EXISTS { ?anySubject a ?neighbor }
          }
          ${valueBindingTemplate}
          ${filterTemplate}
          ${excludedVerticesTemplate}
        }
        ORDER BY ?neighbor
        ${limitTemplate}
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
        BIND(?pToSource as ?p)
        BIND(?resource as ?value)
      }
      UNION
      {
        # Outgoing connection predicate
        BIND(${resourceTemplate} AS ?resource)
        ?resource ?pFromSource ?neighbor
        BIND(?neighbor as ?value)
        BIND(?pFromSource as ?p)
        BIND(?resource as ?subject)
      }
      UNION
      {
        # Values and types
        ?neighbor ?p ?value
        FILTER(isLiteral(?value) || ?p = ${rdfTypeUriTemplate})
        BIND(?neighbor as ?subject)
      }
      UNION
      {
        # Source types
        BIND(${resourceTemplate} AS ?resource)
        ?resource ?p ?value
        FILTER(?p = ${rdfTypeUriTemplate})
        BIND(?resource as ?subject)
      }
    }
    ORDER BY ?subject ?p ?value
  `;
}
