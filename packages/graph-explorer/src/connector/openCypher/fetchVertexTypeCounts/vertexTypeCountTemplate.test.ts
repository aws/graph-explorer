import vertexTypeCountTemplate from "./vertexTypeCountTemplate";

describe("OpenCypher > vertexTypeCountTemplate", () => {
  it("should count the vertices with the given label", () => {
    const template = vertexTypeCountTemplate("airport");

    expect(template).toBe("MATCH (v:`airport`) RETURN count(v) AS count");
  });
});
