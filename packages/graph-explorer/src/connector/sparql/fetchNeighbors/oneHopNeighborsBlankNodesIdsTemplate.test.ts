import { createVertexId } from "@/core";
import { normalizeWithNewlines as normalize } from "@/utils/testing";

import oneHopNeighborsBlankNodesIdsTemplate from "./oneHopNeighborsBlankNodesIdsTemplate";

describe("oneHopNeighborsBlankNodesIdsTemplate", () => {
  it("should wrap the neighbor sub-query and select only blank nodes", () => {
    const template = oneHopNeighborsBlankNodesIdsTemplate({
      resourceURI: createVertexId("http://www.example.com/soccer/resource#EPL"),
      limit: 10,
    });

    expect(normalize(template)).toContain(
      normalize("SELECT DISTINCT (?neighbor AS ?bNode)"),
    );
    expect(normalize(template)).toContain(
      normalize("SELECT DISTINCT ?neighbor"),
    );
    expect(normalize(template)).toContain(
      normalize(
        "BIND(<http://www.example.com/soccer/resource#EPL> AS ?resource)",
      ),
    );
    expect(normalize(template)).toContain(normalize("LIMIT 10"));
    expect(normalize(template)).toContain(
      normalize("FILTER(isBlank(?neighbor))"),
    );
  });
});
