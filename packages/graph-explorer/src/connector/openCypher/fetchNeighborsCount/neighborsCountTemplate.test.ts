import { normalize } from "@/utils/testing";
import neighborsCountTemplate from "./neighborsCountTemplate";
import { createVertexId } from "@/core";

describe("OpenCypher > neighborsCountTemplate", () => {
  it("Should return a template for the given vertex id", () => {
    const template = neighborsCountTemplate({
      vertexId: createVertexId("12"),
    });

    expect(normalize(template)).toBe(
      normalize(
        `
          MATCH (v)-[]-(neighbor) 
          WHERE ID(v) = "12" 
          WITH DISTINCT neighbor 
          RETURN labels(neighbor) AS vertexLabel, count(DISTINCT neighbor) AS count
        `
      )
    );
  });
});
