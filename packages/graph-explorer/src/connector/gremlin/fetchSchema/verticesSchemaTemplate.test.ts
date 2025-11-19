import verticesSchemaTemplate from "./verticesSchemaTemplate";
import { normalizeWithNoSpace as normalize } from "@/utils/testing";

describe("Gremlin > verticesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const template = verticesSchemaTemplate({ types: ["airport", "country"] });

    expect(normalize(template)).toBe(
      normalize(`
        g.V().union(
          __.hasLabel("airport").limit(1),
          __.hasLabel("country").limit(1)
        )
        .fold()
        .project("airport", "country")
        .by(unfold().hasLabel("airport"))
        .by(unfold().hasLabel("country"))
      `),
    );
  });
});
