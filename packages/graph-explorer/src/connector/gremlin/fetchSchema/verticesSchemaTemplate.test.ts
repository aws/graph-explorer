import { normalizeWithNoSpace as normalize } from "@/utils/testing";

import verticesSchemaTemplate from "./verticesSchemaTemplate";

describe("Gremlin > verticesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const template = verticesSchemaTemplate({ types: ["airport", "country"] });

    expect(normalize(template)).toBe(
      normalize(`
        g.V().limit(1)
          .project(
            "airport",
            "country"
          )
          .by(V().hasLabel("airport").limit(1))
          .by(V().hasLabel("country").limit(1))
      `),
    );
  });

  it("Should deduplicate labels from multi-label types", () => {
    const template = verticesSchemaTemplate({ types: ["a::b", "b::c"] });

    expect(normalize(template)).toBe(
      normalize(`
        g.V().limit(1)
          .project(
            "a",
            "b",
            "c"
          )
          .by(V().hasLabel("a").limit(1))
          .by(V().hasLabel("b").limit(1))
          .by(V().hasLabel("c").limit(1))
      `),
    );
  });
});
