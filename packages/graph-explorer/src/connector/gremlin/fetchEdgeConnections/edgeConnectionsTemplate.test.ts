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

  it("should give each sampled edge type its own limited branch", () => {
    const template = edgeConnectionsTemplate({
      edgeTypes: [createEdgeType("route"), createEdgeType("contains")],
      limitPerType: 10000,
    });

    // A single limit after hasLabel() would be shared, and a dominant type would
    // fill it before the rest were read at all.
    expect(normalize(template)).toBe(
      normalize(`
        g.V().limit(1).union(
          V().outE('route').limit(10000),
          V().outE('contains').limit(10000)
        )
          .group()
            .by(label())
            .by(
              project('s', 't')
                .by(outV().label().fold())
                .by(inV().label().fold())
                .groupCount()
            )
      `),
    );
  });

  it("should escape special characters in a sampled edge type", () => {
    const template = edgeConnectionsTemplate({
      edgeTypes: [createEdgeType("edge'with'quotes")],
      limitPerType: 10000,
    });

    expect(template).toContain("V().outE('edge\\'with\\'quotes')");
  });

  it("should escape special characters in the edge type", () => {
    const template = edgeConnectionsTemplate({
      edgeTypes: [createEdgeType("edge'with'quotes")],
    });

    expect(template).toContain("hasLabel('edge\\'with\\'quotes')");
  });
});
