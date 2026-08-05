import type { AttributeFilter } from "@/connector/useGEFetchTypes";

import { createVertexId } from "@/core";
import { normalizeWithNoSpace as normalize } from "@/utils/testing";

import { UnrepresentableNumberError } from "../../queryValueError";
import oneHopTemplate from "./oneHopTemplate";

describe("Gremlin > oneHopTemplate", () => {
  it("should produce documentation example", () => {
    // This represents the attribute filters used in the example documentation
    const template = oneHopTemplate({
      vertexId: createVertexId("124"),
      filterByVertexTypes: ["airport"],
      attributeFilters: [
        { name: "city", value: "Sea" },
        { name: "country", value: "ES" },
      ],
      excludedVertices: new Set([createVertexId("256")]),
      limit: 10,
    });

    expect(normalize(template)).toEqual(
      normalize(`
        g.V('124').as('start')
          .both()
          .hasLabel('airport').and(has('city',containing('Sea')), has('country',containing('ES')))
          .filter(__.not(__.hasId('256')))
          .dedup()
          .range(0, 10)
          .as('neighbor')
          .project('vertex', 'edges')
            .by()
            .by(
              __.select('start').bothE()
                .where(otherV().where(eq('neighbor')))
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
        g.V('12').as('start')
          .both().dedup().as('neighbor')
          .project('vertex', 'edges')
            .by()
            .by(
              __.select('start').bothE()
                .where(otherV().where(eq('neighbor')))
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
        g.V('12').as('start')
          .both()
          .filter(__.not(__.hasId('256', '512')))
          .dedup().as('neighbor')
          .project('vertex', 'edges')
            .by()
            .by(
              __.select('start').bothE()
                .where(otherV().where(eq('neighbor')))
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
        g.V(12L).as('start')
          .both().dedup().as('neighbor')
          .project('vertex', 'edges')
            .by()
            .by(
              __.select('start').bothE()
                .where(otherV().where(eq('neighbor')))
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
        g.V('12').as('start')
          .both().dedup().range(0, 5).as('neighbor')
          .project('vertex', 'edges')
            .by()
            .by(
              __.select('start').bothE()
                .where(otherV().where(eq('neighbor')))
                .dedup().fold()
            )
      `),
    );
  });

  it("Should reject a limit with no plain decimal form", () => {
    expect(() =>
      oneHopTemplate({ vertexId: createVertexId("12"), limit: Infinity }),
    ).toThrow(new UnrepresentableNumberError(Infinity));
  });

  it("Should return a template for specific vertex type", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["country"],
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V('12').as('start')
          .both().hasLabel('country').dedup().range(0, 10).as('neighbor')
          .project('vertex', 'edges')
            .by()
            .by(
              __.select('start').bothE()
                .where(otherV().where(eq('neighbor')))
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
        g.V('12').as('start')
          .both().hasLabel('country', 'airport', 'continent').dedup().range(0, 10).as('neighbor')
          .project('vertex', 'edges')
            .by()
            .by(
              __.select('start').bothE()
                .where(otherV().where(eq('neighbor')))
                .dedup().fold()
            )
      `),
    );
  });

  it("Should return a template with specific attribute filters", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["country"],
      attributeFilters: [
        { name: "city", value: "Sea" },
        { name: "country", value: "ES" },
      ],
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        g.V('12').as('start')
          .both().hasLabel('country')
            .and(has('city',containing('Sea')),has('country',containing('ES')))
            .dedup().range(0, 10).as('neighbor')
          .project('vertex', 'edges')
            .by()
            .by(
              __.select('start').bothE()
                .where(otherV().where(eq('neighbor')))
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
      normalize(".both().hasLabel('country', 'capital').dedup()"),
    );
  });

  it("should escape a vertex type containing the delimiter", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["coun'try"],
    });

    expect(normalize(template)).toContain(
      normalize(".both().hasLabel('coun\\'try').dedup()"),
    );
  });

  describe("attribute filters", () => {
    function fragmentFor(attributeFilters: AttributeFilter[]) {
      return normalize(
        oneHopTemplate({
          vertexId: createVertexId("12"),
          attributeFilters,
        }),
      );
    }

    it("matches an attribute containing the value", () => {
      expect(fragmentFor([{ name: "country", value: "ES" }])).toContain(
        normalize("and(has('country',containing('ES')))"),
      );
    });

    it("requires every filter to match", () => {
      expect(
        fragmentFor([
          { name: "city", value: "Sea" },
          { name: "country", value: "US" },
        ]),
      ).toContain(
        normalize(
          "and(has('city',containing('Sea')), has('country',containing('US')))",
        ),
      );
    });

    it("escapes an attribute name containing the delimiter", () => {
      expect(fragmentFor([{ name: "ci'ty", value: "Sea" }])).toContain(
        normalize("and(has('ci\\'ty',containing('Sea')))"),
      );
    });

    it("escapes a filter value containing the delimiter", () => {
      expect(fragmentFor([{ name: "city", value: "Se'a" }])).toContain(
        normalize("and(has('city',containing('Se\\'a')))"),
      );
    });

    it("omits the filter step when there are no filters", () => {
      expect(fragmentFor([])).toBe(
        normalize(`
          g.V('12').as('start')
            .both()
            .dedup()
            .as('neighbor')
            .project('vertex', 'edges')
              .by()
              .by(
                __.select('start').bothE()
                  .where(otherV().where(eq('neighbor')))
                  .dedup().fold()
              )
        `),
      );
    });
  });
});
