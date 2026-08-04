import { createEdgeType } from "@/core";
import { normalizeWithNoSpace as normalize } from "@/utils/testing";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

describe("Gremlin > edgeConnectionsTemplate", () => {
  it("should sample edges of the type and project the endpoint labels", () => {
    const template = edgeConnectionsTemplate(createEdgeType("route"));

    expect(normalize(template)).toBe(
      normalize(`
        g.E().hasLabel('route').limit(10000)
          .project('sourceType', 'targetType')
          .by(outV().label())
          .by(inV().label())
          .dedup()
      `),
    );
  });
});
