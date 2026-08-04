import { createVertexId } from "@/core";
import { LABELS, query } from "@/utils";
import {
  normalize as collapse,
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
                FILTER(isLiteral(?filterValue) && regex(str(?filterValue), "Arsenal", "i"))
              }
              FILTER EXISTS {
                ?neighbor <http://www.example.com/soccer/ontology/nickname> ?filterValue .
                FILTER(isLiteral(?filterValue) && regex(str(?filterValue), "Gunners", "i"))
              }
            }
            LIMIT 2
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `),
    );
  });

  it("should require every attribute filter to match", () => {
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

    // Each filter gets its own EXISTS, so the filters conjoin rather than
    // widening the results as a shared disjunctive filter would
    expect(collapse(template)).toContain(
      collapse(query`
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/teamName> ?filterValue .
          FILTER(isLiteral(?filterValue) && regex(str(?filterValue), "Arsenal", "i"))
        }
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/nickname> ?filterValue .
          FILTER(isLiteral(?filterValue) && regex(str(?filterValue), "Gunners", "i"))
        }
      `),
    );
  });

  it("should filter on a single attribute", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      attributeFilters: [
        {
          name: "http://www.example.com/soccer/ontology/teamName",
          value: "Arsenal",
        },
      ],
    });

    expect(collapse(template)).toContain(
      collapse(query`
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/teamName> ?filterValue .
          FILTER(isLiteral(?filterValue) && regex(str(?filterValue), "Arsenal", "i"))
        }
      `),
    );
  });

  it("should filter twice on the same attribute", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      attributeFilters: [
        {
          name: "http://www.example.com/soccer/ontology/nickname",
          value: "Gunners",
        },
        {
          name: "http://www.example.com/soccer/ontology/nickname",
          value: "Gooners",
        },
      ],
    });

    // Separate EXISTS clauses let two different values of the same attribute
    // satisfy the pair of filters
    expect(collapse(template)).toContain(
      collapse(query`
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/nickname> ?filterValue .
          FILTER(isLiteral(?filterValue) && regex(str(?filterValue), "Gunners", "i"))
        }
        FILTER EXISTS {
          ?neighbor <http://www.example.com/soccer/ontology/nickname> ?filterValue .
          FILTER(isLiteral(?filterValue) && regex(str(?filterValue), "Gooners", "i"))
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
