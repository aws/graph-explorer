import vertexTypeCountTemplate from "./vertexTypeCountTemplate";

describe("Gremlin > vertexTypeCountTemplate", () => {
  it("should count the vertices with the given label", () => {
    const template = vertexTypeCountTemplate("airport");

    expect(template).toBe('g.V().hasLabel("airport").count()');
  });
});
