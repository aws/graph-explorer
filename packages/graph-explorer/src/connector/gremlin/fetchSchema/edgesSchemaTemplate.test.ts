import { normalizeWithNoSpace as normalize } from "@/utils/testing";

import edgesSchemaTemplate from "./edgesSchemaTemplate";

describe("Gremlin > edgesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const template = edgesSchemaTemplate({ types: ["route", "contain"] });

    expect(normalize(template)).toBe(
      normalize(`
        g.V().limit(1)
          .project(
            "route",
            "contain"
          )
          .by(V().bothE("route").limit(1))
          .by(V().bothE("contain").limit(1))
      `),
    );
  });

  it("Should deduplicate labels from multi-label types", () => {
    const template = edgesSchemaTemplate({ types: ["a::b", "b::c"] });

    expect(normalize(template)).toBe(
      normalize(`
        g.V().limit(1)
          .project(
            "a",
            "b",
            "c"
          )
          .by(V().bothE("a").limit(1))
          .by(V().bothE("b").limit(1))
          .by(V().bothE("c").limit(1))
      `),
    );
  });
});
