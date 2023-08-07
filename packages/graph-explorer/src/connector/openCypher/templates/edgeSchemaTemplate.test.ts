import edgesSchemaTemplate from "./edgesSchemaTemplate";

describe("OpenCypher > edgesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const template = edgesSchemaTemplate({ type: "route" });

    expect(template).toBe(
      `MATCH() -[e:\`route\`]- () RETURN e AS object LIMIT 1`  
    );
  });
});
