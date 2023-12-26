import verticesSchemaTemplate from "./verticesSchemaTemplate";

describe("Gremlin > verticesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const template = verticesSchemaTemplate({ types: ["airport", "country"] });
    const expectedValue = 'g.V()' +
        '.union(' +
        '__.hasLabel("airport").limit(1),' +
        '__.hasLabel("country").limit(1)' +
        ')' +
        '.fold()' +
        '.project("airport","country")' +
        '.by(unfold().hasLabel("airport"))' +
        '.by(unfold().hasLabel("country"))'

    expect(template).toBe(
        expectedValue
    );
  });
});
