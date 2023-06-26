import edgesSchemaTemplate from "./edgesSchemaTemplate";

describe("Gremlin > edgesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const types = ["route", "contain"];
    const query = edgesSchemaTemplate({ types });
    const expectedQuery =
      'g.E().project("route","contain").by(V().bothE("route").limit(1)).by(V().bothE("contain").limit(1)).limit(1)';
    expect(query).toEqual(expectedQuery);
  });
});
