import { createVertexId } from "@/core";
import { LABELS, query } from "@/utils";
import {
  normalize as normalizeCollapsed,
  normalizeWithNewlines as normalize,
} from "@/utils/testing";

import { oneHopNeighborsTemplate } from "./oneHopNeighborsTemplate";

describe("oneHopNeighborsTemplate", () => {
  it("should filter to subjects with no type when the missing-type class is requested", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      subjectClasses: [LABELS.MISSING_TYPE],
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?predicate ?resource .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
                FILTER NOT EXISTS { ?subject a ?class }
              }
              UNION
              {
                ?resource ?predicate ?neighbor .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
                FILTER NOT EXISTS { ?subject a ?class }
              }
            }
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `),
    );
  });

  it("should produce documentation example", () => {
    // This represents the attribute filters used in the example documentation
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      subjectClasses: ["http://www.example.com/soccer/ontology/Team"],
      attributeFilters: [
        {
          name: "http://www.example.com/soccer/ontology/teamName",
          value: "Arsenal",
        },
        {
          name: "http://www.example.com/soccer/ontology/nickname",
          value: "Gunners",
        },
      ],
      limit: 2,
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?predicate ?resource .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
                FILTER (?class IN (<http://www.example.com/soccer/ontology/Team>))
              }
              UNION
              {
                ?resource ?predicate ?neighbor .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
                FILTER (?class IN (<http://www.example.com/soccer/ontology/Team>))
              }
              FILTER EXISTS {
                ?neighbor <http://www.example.com/soccer/ontology/teamName> ?filterValue .
                FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("Arsenal")))
              }
              FILTER EXISTS {
                ?neighbor <http://www.example.com/soccer/ontology/nickname> ?filterValue .
                FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("Gunners")))
              }
            }
            LIMIT 2
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `),
    );
  });

  it("should produce query for resource", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      limit: 10,
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?predicate ?resource .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              }
              UNION
              {
                ?resource ?predicate ?neighbor .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              }
            }
            LIMIT 10
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `),
    );
  });

  it("should produce query for multiple subject classes", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      subjectClasses: [
        "http://www.example.com/soccer/ontology/Team",
        "http://www.example.com/soccer/ontology/Player",
      ],
    });
    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?predicate ?resource .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
                FILTER (?class IN (<http://www.example.com/soccer/ontology/Team>, <http://www.example.com/soccer/ontology/Player>))
              }
              UNION
              {
                ?resource ?predicate ?neighbor .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
                FILTER (?class IN (<http://www.example.com/soccer/ontology/Team>, <http://www.example.com/soccer/ontology/Player>))
              }
            }
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `),
    );
  });

  it("should produce query with limit of zero", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      limit: 0,
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?predicate ?resource .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              }
              UNION
              {
                ?resource ?predicate ?neighbor .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              }
            }
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `),
    );
  });

  it("should produce query with limit", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      limit: 10,
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?predicate ?resource .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              }
              UNION
              {
                ?resource ?predicate ?neighbor .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              }
            }
            LIMIT 10
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `),
    );
  });

  it("should produce query excluding resources", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      excludedVertices: new Set([
        createVertexId("http://www.example.com/soccer/resource#EFL"),
        createVertexId("http://www.example.com/soccer/resource#EFL2"),
      ]),
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?predicate ?resource .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(
                  !isLiteral(?neighbor) &&
                  ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  ?neighbor NOT IN (
                    <http://www.example.com/soccer/resource#EFL>,
                    <http://www.example.com/soccer/resource#EFL2>
                  )
                )
              }
              UNION
              {
                ?resource ?predicate ?neighbor .
                OPTIONAL { ?neighbor a ?class } .
                FILTER(
                  !isLiteral(?neighbor) &&
                  ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  ?neighbor NOT IN (
                    <http://www.example.com/soccer/resource#EFL>,
                    <http://www.example.com/soccer/resource#EFL2>
                  )
                )
              }
            }
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `),
    );
  });

  it("should conjoin multiple attribute filters as adjacent FILTER EXISTS blocks", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      attributeFilters: [
        {
          name: "http://www.example.com/soccer/ontology/teamName",
          value: "Arsenal",
        },
        {
          name: "http://www.example.com/soccer/ontology/nickname",
          value: "Gunners",
        },
      ],
    });

    // Two adjacent FILTER EXISTS blocks conjoin the filters (AND). Reverting to
    // any OR form (a shared ?pValue with `||`) must fail this assertion.
    expect(normalizeCollapsed(template)).toContain(
      normalizeCollapsed(query`
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/teamName> ?filterValue .
          FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("Arsenal")))
        }
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/nickname> ?filterValue .
          FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("Gunners")))
        }
      `),
    );
    expect(template).not.toContain("?pValue");
  });

  it("should produce a single FILTER EXISTS for one attribute filter", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      attributeFilters: [
        {
          name: "http://www.example.com/soccer/ontology/teamName",
          value: "Arsenal",
        },
      ],
    });

    expect(normalizeCollapsed(template)).toContain(
      normalizeCollapsed(query`
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/teamName> ?filterValue .
          FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("Arsenal")))
        }
      `),
    );
  });

  it("should produce one existential FILTER EXISTS per filter on the same attribute", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      attributeFilters: [
        {
          name: "http://www.example.com/soccer/ontology/nickname",
          value: "Gunners",
        },
        {
          name: "http://www.example.com/soccer/ontology/nickname",
          value: "Reds",
        },
      ],
    });

    expect(normalizeCollapsed(template)).toContain(
      normalizeCollapsed(query`
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/nickname> ?filterValue .
          FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("Gunners")))
        }
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/nickname> ?filterValue .
          FILTER(isLiteral(?filterValue) && CONTAINS(LCASE(STR(?filterValue)), LCASE("Reds")))
        }
      `),
    );
  });

  it("should not emit any FILTER EXISTS when there are no attribute filters", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
    });

    expect(template).not.toContain("FILTER EXISTS");
  });

  it("should treat regex metacharacters in an attribute filter value as literal text", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      attributeFilters: [
        {
          name: "http://www.example.com/soccer/ontology/teamName",
          value: "a.(b",
        },
      ],
    });

    expect(template).toContain(`LCASE("a.(b")`);
    expect(template).not.toContain("regex(");
  });
});

/**
 * This part of the query is very repetitive and makes it tough to see which
 * parts of the query change from test to test.
 */
function commonPartOfQuery(resourceURI: string) {
  return query`
    {
      SELECT *
      WHERE {
        {
          BIND(<${resourceURI}> AS ?resource)
          ?neighbor ?pToSource ?resource
          BIND(?neighbor as ?subject)
          BIND(?pToSource as ?predicate)
          BIND(?resource as ?object)
        }
        UNION
        {
          BIND(<${resourceURI}> AS ?resource)
          ?resource ?pFromSource ?neighbor
          BIND(?neighbor as ?object)
          BIND(?pFromSource as ?predicate)
          BIND(?resource as ?subject)
        }
        UNION
        {
          ?neighbor ?predicate ?object
          FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
          BIND(?neighbor as ?subject)
        }
      }
    }
  `;
}
