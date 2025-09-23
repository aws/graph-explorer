import { oneHopNeighborsTemplate } from "./oneHopNeighborsTemplate";
import { createVertexId } from "@/core";
import { query } from "@/utils";
import { normalizeWithNewlines as normalize } from "@/utils/testing";

describe("oneHopNeighborsTemplate", () => {
  it("should produce documentation example", () => {
    // This represents the filter criteria used in the example documentation
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      resourceClasses: [],
      subjectClasses: ["http://www.example.com/soccer/ontology/Team"],
      filterCriteria: [
        {
          predicate: "http://www.example.com/soccer/ontology/teamName",
          object: "Arsenal",
        },
        {
          predicate: "http://www.example.com/soccer/ontology/nickname",
          object: "Gunners",
        },
      ],
      limit: 2,
      offset: 0,
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?p ?value
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              VALUES ?class { <http://www.example.com/soccer/ontology/Team> }
              {
                ?neighbor ?p ?resource .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor)
                )
              }
              UNION
              {
                ?resource ?p ?neighbor .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor)
                )
              }
              ?neighbor ?pValue ?value .
              FILTER(
                isLiteral(?value) && (
                  (?pValue=<http://www.example.com/soccer/ontology/teamName> && regex(str(?value), "Arsenal", "i")) ||
                  (?pValue=<http://www.example.com/soccer/ontology/nickname> && regex(str(?value), "Gunners", "i"))
                )
              )
            }
            LIMIT 2
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `)
    );
  });

  it("should produce query for resource", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      resourceClasses: [],
      limit: 10,
      offset: 0,
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?p ?value
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?p ?resource .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor)
                )
              }
              UNION
              {
                ?resource ?p ?neighbor .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor)
                )
              }
            }
            LIMIT 10
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `)
    );
  });

  it("should produce query for multiple subject classes", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      resourceClasses: [],
      subjectClasses: [
        "http://www.example.com/soccer/ontology/Team",
        "http://www.example.com/soccer/ontology/Player",
      ],
    });
    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?p ?value
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              VALUES ?class { <http://www.example.com/soccer/ontology/Team> <http://www.example.com/soccer/ontology/Player> }
              {
                ?neighbor ?p ?resource .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor)
                )
              }
              UNION
              {
                ?resource ?p ?neighbor .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor)
                )
              }
            }
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `)
    );
  });

  it("should produce query with limit of zero", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      resourceClasses: [],
      limit: 0,
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?p ?value
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?p ?resource .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor)
                )
              }
              UNION
              {
                ?resource ?p ?neighbor .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor)
                )
              }
            }
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `)
    );
  });

  it("should produce query with limit and offset", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      resourceClasses: [],
      limit: 10,
      offset: 5,
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?p ?value
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?p ?resource .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor)
                )
              }
              UNION
              {
                ?resource ?p ?neighbor .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor)
                )
              }
            }
            LIMIT 10 OFFSET 5
          }
          ${commonPartOfQuery("http://www.example.com/soccer/resource#EPL")}
        }
      `)
    );
  });

  it("should produce query excluding resources", () => {
    const template = oneHopNeighborsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      resourceClasses: [],
      excludedVertices: new Set([
        createVertexId("http://www.example.com/soccer/resource#EFL"),
        createVertexId("http://www.example.com/soccer/resource#EFL2"),
      ]),
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?p ?value
        WHERE {
          {
            SELECT DISTINCT ?neighbor
            WHERE {
              BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)
              {
                ?neighbor ?p ?resource .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor) &&
                  ?neighbor NOT IN (
                    <http://www.example.com/soccer/resource#EFL>,
                    <http://www.example.com/soccer/resource#EFL2>
                  )
                )
              }
              UNION
              {
                ?resource ?p ?neighbor .
                ?neighbor a ?class .
                FILTER(
                  ?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
                  !isLiteral(?neighbor) &&
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
      `)
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
      BIND(<${resourceURI}> AS ?resource)
      ?neighbor ?pToSource ?resource
      BIND(?neighbor as ?subject)
      BIND(?pToSource as ?p)
      BIND(?resource as ?value)
    }
    UNION
    {
      BIND(<${resourceURI}> AS ?resource)
      ?resource ?pFromSource ?neighbor
      BIND(?neighbor as ?value)
      BIND(?pFromSource as ?p)
      BIND(?resource as ?subject)
    }
    UNION
    {
      ?neighbor ?p ?value
      FILTER(isLiteral(?value) || ?p = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
      BIND(?neighbor as ?subject)
    }
    UNION
    {
      BIND(<${resourceURI}> AS ?resource)
      ?resource ?p ?value
      FILTER(?p = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
      BIND(?resource as ?subject)
    }
  `;
}
