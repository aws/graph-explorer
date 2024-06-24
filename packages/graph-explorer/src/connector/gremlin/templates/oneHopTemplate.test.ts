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
        g.V("12")
          .both().dedup().order().as("v")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("v").bothE()
                .where(otherV().id().is("12"))
                .dedup().fold()
            )
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
        g.V(12L)
          .both().dedup().order().as("v")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("v").bothE()
                .where(otherV().id().is(12L))
                .dedup().fold()
            )
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
        g.V("12")
          .both().dedup().order().range(5, 10).as("v")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("v").bothE()
                .where(otherV().id().is("12"))
                .dedup().fold()
            )
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
        g.V("12")
          .both().hasLabel("country").dedup().order().range(5, 15).as("v")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("v").bothE()
                .where(otherV().id().is("12"))
                .dedup().fold()
            )
      `)
    );
  });

  it("Should return a template for multiple vertex type", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      idType: "string",
      filterByVertexTypes: ["country", "airport", "continent"],
      offset: 5,
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12")
          .both().hasLabel("country", "airport", "continent").dedup().order().range(5, 15).as("v")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("v").bothE()
                .where(otherV().id().is("12"))
                .dedup().fold()
            )
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
        g.V("12")
          .both().hasLabel("country")
            .and(has("longest",gte(10000)),has("country",containing("ES")))
            .dedup().order().range(5, 15).as("v")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("v").bothE()
                .where(otherV().id().is("12"))
                .dedup().fold()
            )
      `)
    );
  });
});
