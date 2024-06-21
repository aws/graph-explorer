import { normalizeWithNoSpace as normalize } from "../../../utils/testing";
import oneHopTemplate from "./oneHopTemplate";

describe("Gremlin > oneHopTemplate", () => {
  it("Should return a template for a simple vertex id", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      idType: "string",
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").project("vertices", "edges")
          .by(both().dedup().fold())
          .by(bothE().dedup().fold())
      `)
    );
  });

  it("Should return a template for a simple vertex id with number type", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      idType: "number",
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V(12L).project("vertices", "edges")
          .by(both().dedup().fold())
          .by(bothE().dedup().fold())
      `)
    );
  });

  it("Should return a template with an offset and limit", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      idType: "string",
      offset: 5,
      limit: 5,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").project("vertices", "edges")
          .by(both().dedup().range(5, 10).fold())
          .by(bothE().dedup().fold())
      `)
    );
  });

  it("Should return a template for specific vertex type", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      idType: "string",
      filterByVertexTypes: ["country"],
      offset: 5,
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").project("vertices", "edges")
          .by(both().hasLabel("country").dedup().range(5, 15).fold())
          .by(bothE().where(otherV().hasLabel("country")).dedup().fold())
      `)
    );
  });

  it("Should return a template with specific filter criteria", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      idType: "string",
      filterByVertexTypes: ["country"],
      filterCriteria: [
        { name: "longest", value: 10000, operator: "gte", dataType: "Number" },
        { name: "country", value: "ES", operator: "like" },
      ],
      offset: 5,
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").project("vertices", "edges")
          .by(both().hasLabel("country")
          .and(has("longest",gte(10000)),has("country",containing("ES")))
          .dedup().range(5, 15).fold())
          .by(bothE().where(otherV().hasLabel("country")).dedup().fold())
      `)
    );
  });
});
