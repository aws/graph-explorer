import verticesSchemaTemplate from "./verticesSchemaTemplate";

describe("Gremlin > verticesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const template = verticesSchemaTemplate({ types: ["airport", "country"] });

    expect(template).toBe(
      'g.V().project("airport","country")' +
        '.by(V().hasLabel("airport").limit(1))' +
        '.by(V().hasLabel("country").limit(1))' +
        ".limit(1)"
    );
  });
});
