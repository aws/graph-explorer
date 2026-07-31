import type { AttributeFilter } from "@/connector/useGEFetchTypes";

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
        MATCH (v)-[e]-(tgt:\`country\`) 
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
        WHERE ID(v) = "12" AND (v:\`country\` OR v:\`continent\` OR v:\`airport\` OR v:\`person\`)
        RETURN
          collect(DISTINCT tgt) AS vObjects,
          collect(e) AS eObjects
      `,
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

    expect(template).toBe(
      query`
        MATCH (v)-[e]-(tgt:\`country\`)
        WHERE ID(v) = "12" AND tgt.\`city\` CONTAINS "Sea" AND tgt.\`country\` CONTAINS "ES"
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
        MATCH (v)-[e]-(tgt:\`airport\`)
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

    expect(template).toContain(
      "(v:`country` OR v:`capital` OR v:`city` OR v:`town`)",
    );
  });

  describe("attribute filters", () => {
    function templateFor(attributeFilters: AttributeFilter[]) {
      return oneHopTemplate({
        vertexId: createVertexId("12"),
        attributeFilters,
      });
    }

    it("matches an attribute containing the value", () => {
      expect(templateFor([{ name: "country", value: "ES" }])).toContain(
        'tgt.`country` CONTAINS "ES"',
      );
    });

    it("requires every filter to match", () => {
      expect(
        templateFor([
          { name: "city", value: "Sea" },
          { name: "country", value: "US" },
        ]),
      ).toContain('tgt.`city` CONTAINS "Sea" AND tgt.`country` CONTAINS "US"');
    });

    it("omits the filter condition when there are no filters", () => {
      expect(templateFor([])).toBe(
        query`
          MATCH (v)-[e]-(tgt)
          WHERE ID(v) = "12"
          RETURN
            collect(DISTINCT tgt) AS vObjects,
            collect(e) AS eObjects
        `,
      );
    });
  });
});
