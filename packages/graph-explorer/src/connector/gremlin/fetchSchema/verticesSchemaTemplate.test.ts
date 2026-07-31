import { normalizeWithNoSpace as normalize } from "@/utils/testing";

import verticesSchemaTemplate from "./verticesSchemaTemplate";

describe("Gremlin > verticesSchemaTemplate", () => {
  it("Should return a template with the projection of each type", () => {
    const template = verticesSchemaTemplate({ types: ["airport", "country"] });

    expect(normalize(template)).toBe(
      normalize(`
        g.V().limit(1)
          .project(
            'airport',
            'country'
          )
          .by(V().hasLabel('airport').limit(1))
          .by(V().hasLabel('country').limit(1))
      `),
    );
  });

  it("Should deduplicate labels from multi-label types", () => {
    const template = verticesSchemaTemplate({ types: ["a::b", "b::c"] });

    expect(normalize(template)).toBe(
      normalize(`
        g.V().limit(1)
          .project(
            'a',
            'b',
            'c'
          )
          .by(V().hasLabel('a').limit(1))
          .by(V().hasLabel('b').limit(1))
          .by(V().hasLabel('c').limit(1))
      `),
    );
  });

  it("should drop an empty segment from a multi-label type", () => {
    // A database label like `airport::` splits to an empty segment. Schema
    // discovery has no user to show an error to, so the segment is dropped
    // rather than failing the whole sync.
    const template = verticesSchemaTemplate({ types: ["airport::"] });

    expect(normalize(template)).toBe(
      normalize(`
        g.V().limit(1)
          .project(
            'airport'
          )
          .by(V().hasLabel('airport').limit(1))
      `),
    );
  });

  it("should escape a single quote in a label", () => {
    const template = verticesSchemaTemplate({ types: ["air'port"] });

    expect(normalize(template)).toBe(
      normalize(`
        g.V().limit(1)
          .project(
            'air\\'port'
          )
          .by(V().hasLabel('air\\'port').limit(1))
      `),
    );
  });
});
