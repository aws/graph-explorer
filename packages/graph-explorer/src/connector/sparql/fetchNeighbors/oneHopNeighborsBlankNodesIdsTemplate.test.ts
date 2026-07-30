import { createVertexId } from "@/core";
import { query } from "@/utils";
import { normalizeWithNewlines as normalize } from "@/utils/testing";

import oneHopNeighborsBlankNodesIdsTemplate from "./oneHopNeighborsBlankNodesIdsTemplate";

describe("oneHopNeighborsBlankNodesIdsTemplate", () => {
  it("should wrap the neighbor sub-query and select only blank nodes", () => {
    const template = oneHopNeighborsBlankNodesIdsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      limit: 10,
    });

    expect(normalize(template)).toEqual(
      normalize(query`
        SELECT DISTINCT (?neighbor AS ?bNode) {
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
          FILTER(isBlank(?neighbor))
        }
      `),
    );
  });
});
