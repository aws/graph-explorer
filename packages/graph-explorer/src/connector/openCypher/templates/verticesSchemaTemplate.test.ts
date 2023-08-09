import verticesSchemaTemplate from "./verticesSchemaTemplate";

describe("OpenCypher > verticesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const template = verticesSchemaTemplate({ type: "country" });

    expect(template).toBe(
      'MATCH (v:\`country\`) RETURN v AS object LIMIT 1'
    );
  });
});
