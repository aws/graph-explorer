import { createVertexId } from "@/core";
import { query } from "@/utils";

import oneHopTemplate from "./oneHopTemplate";

describe("OpenCypher > oneHopTemplate", () => {
  it("Should return a template for a simple vertex id", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
    });

    expect(template).toEqual(
      query`
        MATCH (v)-[e]-(tgt)
        WHERE ID(v) = "12"
        RETURN
          collect(DISTINCT tgt) AS vObjects,
          collect(e) AS eObjects
      `,
    );
  });

  it("Should filter out excluded vertices", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      excludedVertices: new Set([createVertexId("256"), createVertexId("512")]),
    });

    expect(template).toEqual(
      query`
        MATCH (v)-[e]-(tgt)
        WHERE ID(v) = "12" AND NOT ID(tgt) IN ["256", "512"]
        RETURN
          collect(DISTINCT tgt) AS vObjects,
          collect(e) AS eObjects
      `,
    );
  });

  it("Should return a template with a limit", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      limit: 5,
    });

    expect(template).toBe(
      query`
        MATCH (v)-[e]-(tgt) 
        WHERE ID(v) = "12" 
        WITH DISTINCT v, tgt 
        ORDER BY toInteger(ID(tgt)) 
        LIMIT 5
        MATCH (v)-[e]-(tgt)
        RETURN 
          collect(DISTINCT tgt) AS vObjects, 
          collect(e) AS eObjects 
      `,
    );
  });

  it("Should return a template for specific vertex type", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["country"],
      limit: 10,
    });

    expect(template).toBe(
      query`
        MATCH (v)-[e]-(tgt:country) 
        WHERE ID(v) = "12" 
        WITH DISTINCT v, tgt 
        ORDER BY toInteger(ID(tgt)) 
        LIMIT 10
        MATCH (v)-[e]-(tgt)
        RETURN 
          collect(DISTINCT tgt) AS vObjects, 
          collect(e) AS eObjects 
      `,
    );
  });

  it("Should return a template for many vertex types", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["country", "continent", "airport", "person"],
    });

    expect(template).toBe(
      query`
        MATCH (v)-[e]-(tgt)
        WHERE ID(v) = "12" AND (v:country OR v:continent OR v:airport OR v:person)
        RETURN
          collect(DISTINCT tgt) AS vObjects,
          collect(e) AS eObjects
      `,
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

    expect(template).toBe(
      query`
        MATCH (v)-[e]-(tgt:country) 
        WHERE ID(v) = "12" AND tgt.longest >= 10000 AND tgt.country CONTAINS "ES" 
        WITH DISTINCT v, tgt 
        ORDER BY toInteger(ID(tgt)) 
        LIMIT 10
        MATCH (v)-[e]-(tgt)
        RETURN 
          collect(DISTINCT tgt) AS vObjects, 
          collect(e) AS eObjects 
      `,
    );
  });

  it("should return template for the example documentation", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("124"),
      filterByVertexTypes: ["airport"],
      limit: 10,
    });

    expect(template).toBe(
      query`
        MATCH (v)-[e]-(tgt:airport)
        WHERE ID(v) = "124"
        WITH DISTINCT v, tgt
        ORDER BY toInteger(ID(tgt))
        LIMIT 10
        MATCH (v)-[e]-(tgt)
        RETURN
          collect(DISTINCT tgt) AS vObjects,
          collect(e) AS eObjects
      `,
    );
  });

  it("should expand Neptune multi-label types into separate labels on '::'", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["country::capital", "city::town"],
    });

    expect(template).toContain("(v:country OR v:capital OR v:city OR v:town)");
  });

  // Each criterion dataType and operator produces a distinct WHERE fragment.
  describe("filter criteria", () => {
    function templateFor(criterion: {
      name: string;
      value: string | number;
      operator: string;
      dataType?: "Number" | "String" | "Date";
    }) {
      return oneHopTemplate({
        vertexId: createVertexId("12"),
        filterCriteria: [criterion],
      });
    }

    it.each([
      ["eq", "tgt.longest = 10000"],
      ["==", "tgt.longest = 10000"],
      ["gt", "tgt.longest > 10000"],
      ["gte", "tgt.longest >= 10000"],
      ["lt", "tgt.longest < 10000"],
      ["lte", "tgt.longest <= 10000"],
      ["neq", "tgt.longest <> 10000"],
    ])("renders a Number criterion with the %s operator", (operator, frag) => {
      expect(
        templateFor({
          name: "longest",
          value: 10000,
          operator,
          dataType: "Number",
        }),
      ).toContain(frag);
    });

    it.each([
      ["eq", 'tgt.country = "ES"'],
      ["neq", 'tgt.country <> "ES"'],
      ["like", 'tgt.country CONTAINS "ES"'],
    ])("renders a String criterion with the %s operator", (operator, frag) => {
      expect(
        templateFor({
          name: "country",
          value: "ES",
          operator,
          dataType: "String",
        }),
      ).toContain(frag);
    });

    it("treats a criterion without a dataType as a String", () => {
      expect(
        templateFor({ name: "country", value: "ES", operator: "eq" }),
      ).toContain('tgt.country = "ES"');
    });

    it.each([
      ["eq", 'tgt.created = DateTime("2020")'],
      ["gt", 'tgt.created > DateTime("2020")'],
      ["gte", 'tgt.created >= DateTime("2020")'],
      ["lt", 'tgt.created < DateTime("2020")'],
      ["lte", 'tgt.created <= DateTime("2020")'],
      ["neq", 'tgt.created <> DateTime("2020")'],
    ])("renders a Date criterion with the %s operator", (operator, frag) => {
      expect(
        templateFor({
          name: "created",
          value: "2020",
          operator,
          dataType: "Date",
        }),
      ).toContain(frag);
    });

    it("escapes a double quote in a String criterion value", () => {
      expect(
        templateFor({
          name: "country",
          value: 'E"S',
          operator: "eq",
          dataType: "String",
        }),
      ).toContain('tgt.country = "E\\"S"');
    });

    it("escapes a double quote in a Date criterion value", () => {
      expect(
        templateFor({
          name: "created",
          value: '20"20',
          operator: "eq",
          dataType: "Date",
        }),
      ).toContain('tgt.created = DateTime("20\\"20")');
    });

    it("coerces a non-string String criterion value to text", () => {
      expect(
        templateFor({
          name: "longest",
          value: 10000,
          operator: "eq",
          dataType: "String",
        }),
      ).toContain('tgt.longest = "10000"');
    });
  });
});
