import vertexTypeCountTemplate from "./vertexTypeCountTemplate";

describe("Gremlin > vertexTypeCountTemplate", () => {
  it("should count the vertices with the given label", () => {
    const template = vertexTypeCountTemplate("airport");

    expect(template).toBe("g.V().hasLabel('airport').count()");
  });

  it("should escape a single quote in the label", () => {
    const template = vertexTypeCountTemplate("air'port");

    expect(template).toBe("g.V().hasLabel('air\\'port').count()");
  });
});
