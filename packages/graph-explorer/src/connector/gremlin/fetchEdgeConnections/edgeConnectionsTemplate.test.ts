import { createEdgeType } from "@/core";
import { normalizeWithNoSpace as normalize } from "@/utils/testing";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

describe("Gremlin > edgeConnectionsTemplate", () => {
  it("should count the distinct edge type and endpoint label combinations over every edge", () => {
    const template = edgeConnectionsTemplate({});

    expect(normalize(template)).toBe(
      normalize(`
        g.E()
          .groupCount()
            .by(
              project('e', 's', 't')
                .by(label())
                .by(outV().label().fold())
                .by(inV().label().fold())
            )
      `),
    );
  });

  it("should filter to the given edge types", () => {
    const template = edgeConnectionsTemplate({
      edgeTypes: [createEdgeType("route"), createEdgeType("contains")],
    });

    expect(template).toContain("g.E().hasLabel('route', 'contains')");
  });

  it("should cap the edges scanned when sampling", () => {
    const template = edgeConnectionsTemplate({
      edgeTypes: [createEdgeType("route")],
      limit: 10000,
    });

    expect(template).toContain("g.E().hasLabel('route').limit(10000)");
  });

  it("should escape special characters in the edge type", () => {
    const template = edgeConnectionsTemplate({
      edgeTypes: [createEdgeType("edge'with'quotes")],
    });

    expect(template).toContain("hasLabel('edge\\'with\\'quotes')");
  });
});
