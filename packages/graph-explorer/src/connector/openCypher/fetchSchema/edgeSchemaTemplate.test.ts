import edgesSchemaTemplate from "./edgesSchemaTemplate";

describe("OpenCypher > edgesSchemaTemplate", () => {
  it("returns one directed sample block per edge type, joined by UNION ALL", () => {
    const template = edgesSchemaTemplate({ types: ["route", "contains"] });

    expect(template).toBe(
      "MATCH () -[e:`route`]-> () RETURN e AS object LIMIT 1\n" +
        "UNION ALL\n" +
        "MATCH () -[e:`contains`]-> () RETURN e AS object LIMIT 1",
    );
  });

  it("returns a single block for a single type", () => {
    expect(edgesSchemaTemplate({ types: ["route"] })).toBe(
      "MATCH () -[e:`route`]-> () RETURN e AS object LIMIT 1",
    );
  });
});
