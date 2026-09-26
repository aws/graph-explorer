import { createEdgeType } from "@/core";
import { normalizeWithNoSpace as normalize } from "@/utils/testing";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

describe("Gremlin > edgeConnectionsTemplate", () => {
  it("should give each sampled edge type its own limited branch", () => {
    const template = edgeConnectionsTemplate({
      types: [createEdgeType("route"), createEdgeType("contains")],
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

  it("should escape special characters in the edge type", () => {
    const template = edgeConnectionsTemplate({
      types: [createEdgeType("edge'with'quotes")],
    });

    expect(template).toContain("V().outE('edge\\'with\\'quotes')");
  });
});
