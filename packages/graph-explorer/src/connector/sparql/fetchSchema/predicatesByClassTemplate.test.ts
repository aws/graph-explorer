import { createVertexType } from "@/core";
import { query } from "@/utils";

import predicatesByClassTemplate from "./predicatesByClassTemplate";

describe("SPARQL > predicatesByClassTemplate", () => {
  it("should select literal predicates for a sample subject of the class", () => {
    const template = predicatesByClassTemplate({
      class: createVertexType("http://example.org/Airport"),
    });

    expect(template).toBe(query`
      # Return all predicates which are connected from the given class
      SELECT ?pred (SAMPLE(?object) as ?sample)
      WHERE {
        {
          SELECT ?subject
          WHERE {
            ?subject a <http://example.org/Airport>.
          }
          LIMIT 1
        }
        ?subject ?pred ?object.
        FILTER(!isBlank(?object) && isLiteral(?object))
      }
      GROUP BY ?pred
    `);
  });
});
