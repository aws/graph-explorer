import { createVertexType } from "@/core";
import { query } from "@/utils";

import predicatesByClassTemplate from "./predicatesByClassTemplate";

describe("SPARQL > predicatesByClassTemplate", () => {
  it("should project the class as ?class with the sample subject LIMIT inside and aggregate outside", () => {
    const template = predicatesByClassTemplate({
      classes: [createVertexType("http://example.org/Airport")],
    });

    expect(template).toBe(query`
      # Return all predicates which are connected from the given class
      SELECT ?class ?pred (SAMPLE(?object) as ?sample)
      WHERE {
        {
          SELECT (<http://example.org/Airport> AS ?class) ?pred ?object
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
        }
      }
      GROUP BY ?class ?pred
    `);
  });

  it("should join a batch of classes into one UNION arm each", () => {
    const template = predicatesByClassTemplate({
      classes: [
        createVertexType("http://example.org/Airport"),
        createVertexType("http://example.org/Country"),
      ],
    });

    expect(template).toBe(query`
      # Return all predicates which are connected from the given class
      SELECT ?class ?pred (SAMPLE(?object) as ?sample)
      WHERE {
        {
          SELECT (<http://example.org/Airport> AS ?class) ?pred ?object
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
        }
        UNION
        {
          SELECT (<http://example.org/Country> AS ?class) ?pred ?object
          WHERE {
            {
              SELECT ?subject
              WHERE {
                ?subject a <http://example.org/Country>.
              }
              LIMIT 1
            }
            ?subject ?pred ?object.
            FILTER(!isBlank(?object) && isLiteral(?object))
          }
        }
      }
      GROUP BY ?class ?pred
    `);
  });
});
