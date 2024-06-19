import neighborsCountTemplate from "./neighborsCountTemplate";

describe("OpenCypher > neighborsCountTemplate", () => {
  it("Should return a template for the given vertex id", () => {
    const template = neighborsCountTemplate({
      vertexId: "12",
      idType: "string",
    });

    expect(template).toBe(
      'MATCH (v) -[e]- (t) WHERE ID(v) = "12" RETURN labels(t) AS vertexLabel, count(DISTINCT t) AS count'
    );
  });

  it("Should return a template for the given vertex id with defined limit", () => {
    const template = neighborsCountTemplate({
      vertexId: "12",
      idType: "string",
      limit: 20,
    });

    expect(template).toBe(
      'MATCH (v) -[e]- (t) WHERE ID(v) = "12" RETURN labels(t) AS vertexLabel, count(DISTINCT t) AS count LIMIT 20'
    );
  });

  it("Should return a template for the given vertex id with no limit", () => {
    const template = neighborsCountTemplate({
      vertexId: "12",
      idType: "string",
      limit: 0,
    });

    expect(template).toBe(
      'MATCH (v) -[e]- (t) WHERE ID(v) = "12" RETURN labels(t) AS vertexLabel, count(DISTINCT t) AS count'
    );
  });
});
