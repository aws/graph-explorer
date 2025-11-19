import { normalizeWithNoSpace as normalize } from "@/utils/testing";
import oneHopTemplate from "./oneHopTemplate";
import { createVertexId } from "@/core";

describe("Gremlin > oneHopTemplate", () => {
  it("should produce documentation example", () => {
    // This represents the filter criteria used in the example documentation
    const template = oneHopTemplate({
      vertexId: createVertexId("124"),
      filterByVertexTypes: ["airport"],
      filterCriteria: [
        { name: "longest", dataType: "Number", operator: "gt", value: 10000 },
        { name: "country", dataType: "String", operator: "like", value: "ES" },
      ],
      excludedVertices: new Set([createVertexId("256")]),
      limit: 10,
      offset: 0,
    });

    expect(normalize(template)).toEqual(
      normalize(`
        g.V("124").as("start")
          .both()
          .hasLabel("airport").and(has("longest",gt(10000)), has("country",containing("ES")))
          .filter(__.not(__.hasId("256")))
          .dedup()
          .range(0, 10)
          .as("neighbor")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("start").bothE()
                .where(otherV().where(eq("neighbor")))
                .dedup().fold()
            )
      `),
    );
  });

  it("Should return a template for a simple vertex id", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").as("start")
          .both().dedup().as("neighbor")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("start").bothE()
                .where(otherV().where(eq("neighbor")))
                .dedup().fold()
            )
      `),
    );
  });

  it("should filter out excluded vertices", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      excludedVertices: new Set([createVertexId("256"), createVertexId("512")]),
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").as("start")
          .both()
          .filter(__.not(__.hasId("256", "512")))
          .dedup().as("neighbor")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("start").bothE()
                .where(otherV().where(eq("neighbor")))
                .dedup().fold()
            )
      `),
    );
  });

  it("Should return a template for a simple vertex id with number type", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId(12),
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V(12L).as("start")
          .both().dedup().as("neighbor")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("start").bothE()
                .where(otherV().where(eq("neighbor")))
                .dedup().fold()
            )
      `),
    );
  });

  it("Should return a template with an offset and limit", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      offset: 5,
      limit: 5,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").as("start")
          .both().dedup().range(5, 10).as("neighbor")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("start").bothE()
                .where(otherV().where(eq("neighbor")))
                .dedup().fold()
            )
      `),
    );
  });

  it("Should return a template for specific vertex type", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["country"],
      offset: 5,
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").as("start")
          .both().hasLabel("country").dedup().range(5, 15).as("neighbor")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("start").bothE()
                .where(otherV().where(eq("neighbor")))
                .dedup().fold()
            )
      `),
    );
  });

  it("Should return a template for multiple vertex type", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["country", "airport", "continent"],
      offset: 5,
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").as("start")
          .both().hasLabel("country", "airport", "continent").dedup().range(5, 15).as("neighbor")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("start").bothE()
                .where(otherV().where(eq("neighbor")))
                .dedup().fold()
            )
      `),
    );
  });

  it("Should return a template with specific filter criteria", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
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
        g.V("12").as("start")
          .both().hasLabel("country")
            .and(has("longest",gte(10000)),has("country",containing("ES")))
            .dedup().range(5, 15).as("neighbor")
          .project("vertex", "edges")
            .by()
            .by(
              __.select("start").bothE()
                .where(otherV().where(eq("neighbor")))
                .dedup().fold()
            )
      `),
    );
  });
});
