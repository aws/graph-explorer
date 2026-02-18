import { createEdgeType } from "@/core";
import { query } from "@/utils";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

describe("edgeConnectionsTemplate", () => {
  it("should produce a subquery with LIMIT inside and DISTINCT outside", () => {
    const predicate = createEdgeType("http://example.org/knows");

    const result = edgeConnectionsTemplate(predicate);

    expect(result).toBe(query`
      SELECT DISTINCT ?sourceType ?targetType
      WHERE {
        SELECT ?sourceType ?targetType
        WHERE {
          ?s <http://example.org/knows> ?o .
          FILTER(!isLiteral(?o))
          ?s a ?sourceType .
          ?o a ?targetType .
        }
        LIMIT 10000
      }
    `);
  });
});
