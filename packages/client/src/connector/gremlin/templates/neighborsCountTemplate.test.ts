import neighborsCountTemplate from "./neighborsCountTemplate";

describe("Gremlin > neighborsCountTemplate", () => {
  it("Should return a template for the given vertex id with default limit", () => {
    const template = neighborsCountTemplate({
      vertexId: "12",
    });

    expect(template).toBe(
      'g.V("12").both().limit(500).dedup().group().by(label).by(count())'
    );
  });

  it("Should return a template for the given vertex id with defined limit", () => {
    const template = neighborsCountTemplate({
      vertexId: "12",
      limit: 20,
    });

    expect(template).toBe(
      'g.V("12").both().limit(20).dedup().group().by(label).by(count())'
    );
  });

  it("Should return a template for the given vertex id with no limit", () => {
    const template = neighborsCountTemplate({
      vertexId: "12",
      limit: 0,
    });

    expect(template).toBe(
      'g.V("12").both().dedup().group().by(label).by(count())'
    );
  });
});
