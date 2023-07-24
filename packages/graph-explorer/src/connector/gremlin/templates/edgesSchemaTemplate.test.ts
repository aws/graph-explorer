import edgesSchemaTemplate from "./edgesSchemaTemplate";

describe("Gremlin > edgesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const template = edgesSchemaTemplate({ types: ["route", "contain"] });

    expect(template).toBe(
      'g.E().project("route","contain")' +
      '.by(V().bothE("route").limit(1))' +
      '.by(V().bothE("contain").limit(1))' +
      ".limit(1)"
    );
  });
});
