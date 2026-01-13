import { query } from "@/utils";
import { normalizeWithNewlines as normalize } from "@/utils/testing";

import blankNodeOneHopNeighborsTemplate from "./blankNodeOneHopNeighborsTemplate";

describe("blankNodeOneHopNeighborsTemplate", () => {
  it("should produce query with simple subquery", () => {
    const subQuery =
      "SELECT ?bNode WHERE { ?bNode a <http://example.org/Type> }";
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
});
