import { createEdgeType } from "@/core";
import { query } from "@/utils";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

describe("OpenCypher > edgeConnectionsTemplate", () => {
  it("should sample edges of a single type and tag the rows with the edge type", () => {
    const template = edgeConnectionsTemplate({
      types: [createEdgeType("route")],
    });

    expect(template).toBe(query`
      MATCH (s)-[e:\`route\`]->(t)
      WITH labels(s) AS sourceLabels, labels(t) AS targetLabels
      LIMIT 10000
      RETURN DISTINCT "route" AS edgeType, sourceLabels, targetLabels
    `);
  });

  it("should join a batch of edge types with UNION ALL", () => {
    const template = edgeConnectionsTemplate({
      types: [createEdgeType("route"), createEdgeType("contains")],
    });

    expect(template).toBe(
      [
        query`
          MATCH (s)-[e:\`route\`]->(t)
          WITH labels(s) AS sourceLabels, labels(t) AS targetLabels
          LIMIT 10000
          RETURN DISTINCT "route" AS edgeType, sourceLabels, targetLabels
        `,
        query`
          MATCH (s)-[e:\`contains\`]->(t)
          WITH labels(s) AS sourceLabels, labels(t) AS targetLabels
          LIMIT 10000
          RETURN DISTINCT "contains" AS edgeType, sourceLabels, targetLabels
        `,
      ].join("\nUNION ALL\n"),
    );
  });

  it("should escape special characters in the edge type", () => {
    const template = edgeConnectionsTemplate({
      types: [createEdgeType("edge`with`ticks")],
    });

    // Backtick doubled in the label, JSON-escaped in the literal column
    expect(template).toContain("[e:`edge``with``ticks`]");
    expect(template).toContain('"edge`with`ticks" AS edgeType');
  });
});
