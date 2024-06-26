import verticesSchemaTemplate from "./verticesSchemaTemplate";
import { normalizeWithNoSpace as normalize } from "../../../utils/testing";

describe("Gremlin > verticesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const template = verticesSchemaTemplate({ types: ["airport", "country"] });

    expect(normalize(template)).toBe(
      normalize(`
        g.V().project("airport","country")
          .by(V().hasLabel("airport").limit(1))
          .by(V().hasLabel("country").limit(1))
          .limit(1)
      `)
    );
  });
});
