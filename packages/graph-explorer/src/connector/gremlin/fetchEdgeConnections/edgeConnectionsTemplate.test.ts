import { createEdgeType } from "@/core";
import { normalizeWithNoSpace as normalize } from "@/utils/testing";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

describe("Gremlin > edgeConnectionsTemplate", () => {
  it("should scan a batch of edge types and group the endpoint labels by edge type", () => {
    const template = edgeConnectionsTemplate({
      types: [createEdgeType("route"), createEdgeType("contains")],
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.E().hasLabel('route', 'contains')
          .group()
            .by(label())
            .by(
              limit(10000)
                .project('sourceType', 'targetType')
                .by(outV().label())
                .by(inV().label())
                .dedup()
                .fold()
            )
      `),
    );
  });

  it("should escape special characters in the edge type", () => {
    const template = edgeConnectionsTemplate({
      types: [createEdgeType("edge'with'quotes")],
    });

    expect(template).toContain("hasLabel('edge\\'with\\'quotes')");
  });
});
