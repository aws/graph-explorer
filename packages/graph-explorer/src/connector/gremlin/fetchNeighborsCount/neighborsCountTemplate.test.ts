import { VertexId } from "@/core";
import neighborsCountTemplate from "./neighborsCountTemplate";
import { normalizeWithNoSpace as normalize } from "@/utils/testing";

describe("Gremlin > neighborsCountTemplate", () => {
  it("Should return a template for the given vertex id", () => {
    const template = neighborsCountTemplate({
      vertex: { id: "12" as VertexId, idType: "string" },
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").both().dedup().group().by(label).by(count())
      `)
    );
  });

  it("Should return a template for the given vertex id with number type", () => {
    const template = neighborsCountTemplate({
      vertex: { id: "12" as VertexId, idType: "number" },
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V(12L).both().dedup().group().by(label).by(count())
      `)
    );
  });

  it("Should return a template for the given vertex id with defined limit", () => {
    const template = neighborsCountTemplate({
      vertex: { id: "12" as VertexId, idType: "string" },
      limit: 20,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").both().limit(20).dedup().group().by(label).by(count())
      `)
    );
  });

  it("Should return a template for the given vertex id with no limit", () => {
    const template = neighborsCountTemplate({
      vertex: { id: "12" as VertexId, idType: "string" },
      limit: 0,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").both().dedup().group().by(label).by(count())
      `)
    );
  });
});
