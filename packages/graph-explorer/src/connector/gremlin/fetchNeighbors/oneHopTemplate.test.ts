import { createVertexId } from "@/core";
import { normalizeWithNoSpace as normalize } from "@/utils/testing";

import oneHopTemplate from "./oneHopTemplate";

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

  it("Should return a template with a limit", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      limit: 5,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").as("start")
          .both().dedup().range(0, 5).as("neighbor")
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
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").as("start")
          .both().hasLabel("country").dedup().range(0, 10).as("neighbor")
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
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").as("start")
          .both().hasLabel("country", "airport", "continent").dedup().range(0, 10).as("neighbor")
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
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").as("start")
          .both().hasLabel("country")
            .and(has("longest",gte(10000)),has("country",containing("ES")))
            .dedup().range(0, 10).as("neighbor")
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

  it("should filter neighbors by a single id", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByIds: [createVertexId("42")],
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").as("start")
          .both().hasId("42")
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

  it("should filter neighbors by multiple ids combined with a type", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["airport"],
      filterByIds: [createVertexId("42"), createVertexId(7)],
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V("12").as("start")
          .both().hasLabel("airport").hasId("42", 7L)
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

  it("should expand a Neptune multi-label type into separate labels on '::'", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["country::capital"],
    });

    expect(normalize(template)).toContain(
      normalize('.both().hasLabel("country", "capital").dedup()'),
    );
  });

  // Each criterion dataType and operator produces a distinct predicate fragment.
  describe("filter criteria", () => {
    function fragmentFor(criterion: {
      name: string;
      value: string | number;
      operator: string;
      dataType?: "Number" | "String" | "Date";
    }) {
      return normalize(
        oneHopTemplate({
          vertexId: createVertexId("12"),
          filterCriteria: [criterion],
        }),
      );
    }

    it.each([
      ["eq", 'has("longest",eq(10000))'],
      ["==", 'has("longest",eq(10000))'],
      ["gt", 'has("longest",gt(10000))'],
      ["gte", 'has("longest",gte(10000))'],
      ["lt", 'has("longest",lt(10000))'],
      ["lte", 'has("longest",lte(10000))'],
      ["neq", 'has("longest",neq(10000))'],
    ])("renders a Number criterion with the %s operator", (operator, frag) => {
      expect(
        fragmentFor({
          name: "longest",
          value: 10000,
          operator,
          dataType: "Number",
        }),
      ).toContain(normalize(`and(${frag})`));
    });

    it.each([
      ["eq", 'has("country","ES")'],
      ["neq", 'has("country",neq("ES"))'],
      ["like", 'has("country",containing("ES"))'],
    ])("renders a String criterion with the %s operator", (operator, frag) => {
      expect(
        fragmentFor({
          name: "country",
          value: "ES",
          operator,
          dataType: "String",
        }),
      ).toContain(normalize(`and(${frag})`));
    });

    it("treats a criterion without a dataType as a String", () => {
      expect(
        fragmentFor({ name: "country", value: "ES", operator: "eq" }),
      ).toContain(normalize('and(has("country","ES"))'));
    });

    it.each([
      ["eq", 'has("created",eq(datetime(2020)))'],
      ["gt", 'has("created",gt(datetime(2020)))'],
      ["gte", 'has("created",gte(datetime(2020)))'],
      ["lt", 'has("created",lt(datetime(2020)))'],
      ["lte", 'has("created",lte(datetime(2020)))'],
      ["neq", 'has("created",neq(datetime(2020)))'],
    ])("renders a Date criterion with the %s operator", (operator, frag) => {
      expect(
        fragmentFor({
          name: "created",
          value: 2020,
          operator,
          dataType: "Date",
        }),
      ).toContain(normalize(`and(${frag})`));
    });
  });
});
