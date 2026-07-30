import { createEdgeType } from "@/core";
import { query } from "@/utils";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

describe("OpenCypher > edgeConnectionsTemplate", () => {
  it("should sample edges of the type and return distinct endpoint labels", () => {
    const template = edgeConnectionsTemplate(createEdgeType("route"));

    expect(template).toBe(query`
      MATCH (s)-[e:\`route\`]->(t)
      WITH labels(s) AS sourceLabels, labels(t) AS targetLabels
      LIMIT 10000
      RETURN DISTINCT sourceLabels, targetLabels
    `);
  });
});
