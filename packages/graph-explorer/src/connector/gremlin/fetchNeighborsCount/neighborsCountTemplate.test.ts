import { createVertexId } from "@/core";
import neighborsCountTemplate from "./neighborsCountTemplate";
import { normalizeWithNoSpace as normalize } from "@/utils/testing";

describe("Gremlin > neighborsCountTemplate", () => {
  it("Should return a template for the given vertex id", () => {
    const template = neighborsCountTemplate({
      vertexId: createVertexId("12"),
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").both().dedup().group().by(label).by(count())
      `)
    );
  });

  it("Should return a template for the given vertex id with number type", () => {
    const template = neighborsCountTemplate({
      vertexId: createVertexId(12),
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V(12L).both().dedup().group().by(label).by(count())
      `)
    );
  });
});
