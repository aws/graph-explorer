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
});
