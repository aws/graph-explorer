import { createEdgeType } from "@/core";
import { query } from "@/utils";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

describe("SPARQL > edgeConnectionsTemplate", () => {
  it("should project the predicate as ?edgeType with the sample LIMIT inside and DISTINCT outside", () => {
    const result = edgeConnectionsTemplate({
      predicates: [createEdgeType("http://example.org/knows")],
    });

    expect(result).toBe(query`
      SELECT DISTINCT ?edgeType ?sourceType ?targetType
      WHERE {
        {
          SELECT (<http://example.org/knows> AS ?edgeType) ?sourceType ?targetType
          WHERE {
            {
              SELECT ?sourceType ?targetType
              WHERE {
                ?s <http://example.org/knows> ?o .
                FILTER(!isLiteral(?o))
                ?s a ?sourceType .
                ?o a ?targetType .
              }
              LIMIT 10000
            }
          }
        }
      }
    `);
  });

  it("should join a batch of predicates into one UNION arm each", () => {
    const result = edgeConnectionsTemplate({
      predicates: [
        createEdgeType("http://example.org/knows"),
        createEdgeType("http://example.org/worksAt"),
      ],
    });

    expect(result).toBe(query`
      SELECT DISTINCT ?edgeType ?sourceType ?targetType
      WHERE {
        {
          SELECT (<http://example.org/knows> AS ?edgeType) ?sourceType ?targetType
          WHERE {
            {
              SELECT ?sourceType ?targetType
              WHERE {
                ?s <http://example.org/knows> ?o .
                FILTER(!isLiteral(?o))
                ?s a ?sourceType .
                ?o a ?targetType .
              }
              LIMIT 10000
            }
          }
        }
        UNION
        {
          SELECT (<http://example.org/worksAt> AS ?edgeType) ?sourceType ?targetType
          WHERE {
            {
              SELECT ?sourceType ?targetType
              WHERE {
                ?s <http://example.org/worksAt> ?o .
                FILTER(!isLiteral(?o))
                ?s a ?sourceType .
                ?o a ?targetType .
              }
              LIMIT 10000
            }
          }
        }
      }
    `);
  });
});
