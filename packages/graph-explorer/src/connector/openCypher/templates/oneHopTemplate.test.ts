import oneHopTemplate from "./oneHopTemplate";

describe("OpenCypher > oneHopTemplate", () => {
  it("Should return a template for a simple vertex id", () => {
    const template = oneHopTemplate({
      vertexId: "12",
    });

    expect(template).toBe(
      "MATCH (v)-[e]-(tgt) WHERE ID(v) = \"12\" WITH collect(DISTINCT tgt)[..10] AS vObjects, collect({edge: e, sourceType: labels(v), targetType: labels(tgt)})[..10] AS eObjects RETURN vObjects, eObjects"
    );
  });

  it("Should return a template with an offset and limit", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      offset: 5,
      limit: 5,
    });

    expect(template).toBe(
      "MATCH (v)-[e]-(tgt) WHERE ID(v) = \"12\" WITH collect(DISTINCT tgt)[..5] AS vObjects, collect({edge: e, sourceType: labels(v), targetType: labels(tgt)})[..5] AS eObjects RETURN vObjects, eObjects"
    );
  });

  it("Should return a template for specific vertex type", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      filterByVertexTypes: ["country"],
      offset: 5,
      limit: 10,
    });

    expect(template).toBe(
      "MATCH (v)-[e]-(tgt:country) WHERE ID(v) = \"12\" WITH collect(DISTINCT tgt)[..10] AS vObjects, collect({edge: e, sourceType: labels(v), targetType: labels(tgt)})[..10] AS eObjects RETURN vObjects, eObjects"
    );
  });

  it("Should return a template with specific filter criteria", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      filterByVertexTypes: ["country"],
      filterCriteria: [
        { name: "longest", value: 10000, operator: "gte", dataType: "Number" },
        { name: "country", value: "ES", operator: "like" },
      ],
      offset: 5,
      limit: 10,
    });

    expect(template).toBe(
      "MATCH (v)-[e]-(tgt:country) WHERE ID(v) = \"12\" AND tgt.longest >= 10000 AND tgt.country CONTAINS \"ES\" WITH collect(DISTINCT tgt)[..10] AS vObjects, collect({edge: e, sourceType: labels(v), targetType: labels(tgt)})[..10] AS eObjects RETURN vObjects, eObjects"
    );
  });
});
