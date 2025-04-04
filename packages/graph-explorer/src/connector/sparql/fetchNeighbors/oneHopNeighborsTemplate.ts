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
 *       BIND(<http://www.example.com/soccer/resource#EPL> AS ?source)
 *       VALUES ?class { <http://www.example.com/soccer/ontology/Team> }
 *       {
 *         ?neighbor ?pIncoming ?source .
 *       }
 *       UNION
 *       {
 *         ?source ?pOutgoing ?neighbor .
 *       }
 *       ?neighbor a ?class .
 *       ?neighbor ?pValue ?value .
 *       FILTER(
 *         isLiteral(?value) && (
 *           (?pValue=<http://www.example.com/soccer/ontology/teamName> && regex(str(?value), "Arsenal", "i")) ||
 *           (?pValue=<http://www.example.com/soccer/ontology/nickname> && regex(str(?value), "Gunners", "i"))
 *         )
 *       )
 *       FILTER NOT EXISTS {
 *         ?anySubject a ?neighbor .
 *       }
 *     }
 *     ORDER BY ?neighbor
 *     LIMIT 2 OFFSET 0
 *   }
 *   {
 *     BIND(<http://www.example.com/soccer/resource#EPL> AS ?source)
 *     ?neighbor ?pToSource ?source
 *     BIND(?neighbor as ?subject)
 *     BIND(?pToSource as ?p)
 *     BIND(?source as ?value)
 *   }
 *   UNION
 *   {
 *     BIND(<http://www.example.com/soccer/resource#EPL> AS ?source)
 *     ?source ?pFromSource ?neighbor
 *     BIND(?neighbor as ?value)
 *     BIND(?pFromSource as ?p)
 *     BIND(?source as ?subject)
 *   }
 *   UNION
 *   {
 *     ?neighbor ?p ?value
 *     FILTER(isLiteral(?value) || ?p = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
 *     BIND(?neighbor as ?subject)
 *   }
 *   UNION
 *   {
 *     BIND(<http://www.example.com/soccer/resource#EPL> AS ?source)
 *     ?source ?p ?value
 *     FILTER(?p = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
 *     BIND(?source as ?subject)
 *   }
 * }
 * ORDER BY ?subject
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
  const classBindingTemplate = subjectClasses.length
    ? `?neighbor a ?class .`
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
    SELECT DISTINCT ?subject ?p ?value
    WHERE {
      {
        # This sub-query will give us all unique neighbors within the given limit
        SELECT DISTINCT ?neighbor
        WHERE {
          BIND(${resourceTemplate} AS ?source)
          ${subjectClassesTemplate}
          {
            # Incoming neighbors
            ?neighbor ?pIncoming ?source .
          }
          UNION
          {
            # Outgoing neighbors
            ?source ?pOutgoing ?neighbor .
          }
          ${classBindingTemplate}
          ${valueBindingTemplate}
          ${filterTemplate}
          ${excludedVerticesTemplate}
          # Remove any classes from the list of neighbors
          FILTER NOT EXISTS {
            ?anySubject a ?neighbor .
          }
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
        BIND(${resourceTemplate} AS ?source)
        ?neighbor ?pToSource ?source
        BIND(?neighbor as ?subject)
        BIND(?pToSource as ?p)
        BIND(?source as ?value)
      }
      UNION
      {
        # Outgoing connection predicate
        BIND(${resourceTemplate} AS ?source)
        ?source ?pFromSource ?neighbor
        BIND(?neighbor as ?value)
        BIND(?pFromSource as ?p)
        BIND(?source as ?subject)
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
        BIND(${resourceTemplate} AS ?source)
        ?source ?p ?value
        FILTER(?p = ${rdfTypeUriTemplate})
        BIND(?source as ?subject)
      }
    }
    ORDER BY ?subject
  `;
}
