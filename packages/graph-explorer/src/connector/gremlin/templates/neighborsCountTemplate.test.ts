import neighborsCountTemplate from "./neighborsCountTemplate";

describe("Gremlin > neighborsCountTemplate", () => {
  it("Should return a template for the given vertex id with default limit", () => {
    const template = neighborsCountTemplate({
      vertexId: "12",
      idType: "string",
    });

    expect(template).toBe(
      'g.V("12").both().limit(500).dedup().group().by(label).by(count())'
    );
  });

  it("Should return a template for the given vertex id with default limit and number type", () => {
    const template = neighborsCountTemplate({
      vertexId: "12",
      idType: "number",
    });

    expect(template).toBe(
      "g.V(12L).both().limit(500).dedup().group().by(label).by(count())"
    );
  });

  it("Should return a template for the given vertex id with defined limit", () => {
    const template = neighborsCountTemplate({
      vertexId: "12",
      idType: "string",
      limit: 20,
    });

    expect(template).toBe(
      'g.V("12").both().limit(20).dedup().group().by(label).by(count())'
    );
  });

  it("Should return a template for the given vertex id with no limit", () => {
    const template = neighborsCountTemplate({
      vertexId: "12",
      idType: "string",
      limit: 0,
    });

    expect(template).toBe(
      'g.V("12").both().dedup().group().by(label).by(count())'
    );
  });
});
