import { normalize } from "@/utils/testing";

import edgesSchemaTemplate from "./edgesSchemaTemplate";

describe("OpenCypher > edgesSchemaTemplate", () => {
  it("returns one directed sample block per edge type, joined by UNION ALL", () => {
    const template = edgesSchemaTemplate({ types: ["route", "contains"] });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH () -[e:\`route\`]-> () RETURN e AS object LIMIT 1
        UNION ALL
        MATCH () -[e:\`contains\`]-> () RETURN e AS object LIMIT 1
      `),
    );
  });

  it("returns a single block for a single type", () => {
    expect(edgesSchemaTemplate({ types: ["route"] })).toBe(
      "MATCH () -[e:`route`]-> () RETURN e AS object LIMIT 1",
    );
  });
});
