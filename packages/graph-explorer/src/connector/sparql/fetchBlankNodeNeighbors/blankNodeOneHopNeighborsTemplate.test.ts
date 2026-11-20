import { describe, expect, it } from "vite-plus/test";

import { toQueryFragment } from "@/connector/queryFragment";
import { query } from "@/utils";
import { normalizeWithNewlines as normalize } from "@/utils/testing";

import blankNodeOneHopNeighborsTemplate from "./blankNodeOneHopNeighborsTemplate";

describe("blankNodeOneHopNeighborsTemplate", () => {
  it("should produce query with simple subquery", () => {
    const subQuery = toQueryFragment(
      "SELECT ?bNode WHERE { ?bNode a <http://example.org/Type> }",
    );
    const template = blankNodeOneHopNeighborsTemplate(subQuery);

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            SELECT ?bNode WHERE { ?bNode a <http://example.org/Type> }
          }

          {
            SELECT DISTINCT ?bNode ?neighbor 
            WHERE {
              {
                ?neighbor ?predicate ?bNode .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              } 
              UNION 
              {
                ?bNode ?predicate ?neighbor .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              }
            }
          }

          {
            SELECT *
            WHERE {
              {
                ?neighbor ?predicate ?bNode .
                BIND(?neighbor as ?subject) 
                BIND(?bNode as ?object)
              } UNION {
                ?bNode ?predicate ?neighbor .
                BIND(?bNode as ?subject) 
                BIND(?neighbor as ?object)
              } UNION {
                ?neighbor ?predicate ?object .
                FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
                BIND(?neighbor as ?subject)
              }
            }
          }
        }
      `),
    );
  });

  it("should produce query with complex subquery containing BIND", () => {
    const subQuery = query`
      SELECT ?bNode 
      WHERE { 
        BIND(<http://example.org/resource> AS ?resource)
        ?resource ?p ?bNode .
        FILTER(isBlank(?bNode))
      }
    `;
    const template = blankNodeOneHopNeighborsTemplate(subQuery);

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            SELECT ?bNode 
            WHERE { 
              BIND(<http://example.org/resource> AS ?resource)
              ?resource ?p ?bNode .
              FILTER(isBlank(?bNode))
            }
          }

          {
            SELECT DISTINCT ?bNode ?neighbor 
            WHERE {
              {
                ?neighbor ?predicate ?bNode .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              } 
              UNION 
              {
                ?bNode ?predicate ?neighbor .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              }
            }
          }

          {
            SELECT *
            WHERE {
              {
                ?neighbor ?predicate ?bNode .
                BIND(?neighbor as ?subject) 
                BIND(?bNode as ?object)
              } UNION {
                ?bNode ?predicate ?neighbor .
                BIND(?bNode as ?subject) 
                BIND(?neighbor as ?object)
              } UNION {
                ?neighbor ?predicate ?object .
                FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
                BIND(?neighbor as ?subject)
              }
            }
          }
        }
      `),
    );
  });

  it("should produce query with subquery containing UNION", () => {
    const subQuery = query`
      SELECT ?bNode 
      WHERE { 
        { ?bNode a <http://example.org/TypeA> }
        UNION
        { ?bNode a <http://example.org/TypeB> }
      }
    `;
    const template = blankNodeOneHopNeighborsTemplate(subQuery);

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT ?subject ?predicate ?object
        WHERE {
          {
            SELECT ?bNode 
            WHERE { 
              { ?bNode a <http://example.org/TypeA> }
              UNION
              { ?bNode a <http://example.org/TypeB> }
            }
          }

          {
            SELECT DISTINCT ?bNode ?neighbor 
            WHERE {
              {
                ?neighbor ?predicate ?bNode .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              } 
              UNION 
              {
                ?bNode ?predicate ?neighbor .
                FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
              }
            }
          }

          {
            SELECT *
            WHERE {
              {
                ?neighbor ?predicate ?bNode .
                BIND(?neighbor as ?subject) 
                BIND(?bNode as ?object)
              } UNION {
                ?bNode ?predicate ?neighbor .
                BIND(?bNode as ?subject) 
                BIND(?neighbor as ?object)
              } UNION {
                ?neighbor ?predicate ?object .
                FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
                BIND(?neighbor as ?subject)
              }
            }
          }
        }
      `),
    );
  });

  it("emits the exact query text for a multi-line sub-query", () => {
    const template = blankNodeOneHopNeighborsTemplate(
      query`
        SELECT ?bNode
        WHERE {
          ?bNode a ?c .
        }
      `,
    );

    expect(template).toBe(
      [
        "# Fetch all neighbors and their predicates, values, and classes for blank node",
        "SELECT DISTINCT ?subject ?predicate ?object",
        "WHERE {",
        "  # Find the blank nodes using the original search or expand query",
        "  {",
        "    SELECT ?bNode",
        "    WHERE {",
        "      ?bNode a ?c .",
        "    }",
        "  }",
        "  # Get all neighbors for the blank nodes",
        "  {",
        "    SELECT DISTINCT ?bNode ?neighbor",
        "    WHERE {",
        "      {",
        "        ?neighbor ?predicate ?bNode .",
        "        FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)",
        "      }",
        "      UNION",
        "      {",
        "        ?bNode ?predicate ?neighbor .",
        "        FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)",
        "      }",
        "    }",
        "  }",
        "  # Now get the data for these specific neighbors",
        "  {",
        "    # Executed as a subquery to workaround a query optimization issue",
        "    # [Original Fix PR #942](https://github.com/aws/graph-explorer/pull/942)",
        "    # [Regression PR #1065](https://github.com/aws/graph-explorer/pull/1065)",
        "    # [Second fix PR #1402](https://github.com/aws/graph-explorer/pull/1402)",
        "    SELECT *",
        "    WHERE {",
        "      {",
        "        # Connection predicate",
        "        ?neighbor ?predicate ?bNode .",
        "        BIND(?neighbor as ?subject)",
        "        BIND(?bNode as ?object)",
        "      } UNION {",
        "        # Connection predicate",
        "        ?bNode ?predicate ?neighbor .",
        "        BIND(?bNode as ?subject)",
        "        BIND(?neighbor as ?object)",
        "      } UNION {",
        "        # Neighbor properties",
        "        ?neighbor ?predicate ?object .",
        "        FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)",
        "        BIND(?neighbor as ?subject)",
        "      }",
        "    }",
        "  }",
        "}",
      ].join("\n"),
    );
  });
});
