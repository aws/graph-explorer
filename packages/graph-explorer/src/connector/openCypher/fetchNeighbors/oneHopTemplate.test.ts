import oneHopTemplate from "./oneHopTemplate";
import { createVertexId } from "@/core";
import { query } from "@/utils";

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
          collect({ edge: e, sourceTypes: labels(startNode(e)), targetTypes: labels(endNode(e)) }) AS eObjects
      `
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
          collect({ edge: e, sourceTypes: labels(startNode(e)), targetTypes: labels(endNode(e)) }) AS eObjects
      `
    );
  });

  it("Should return a template with an offset and limit", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      offset: 5,
      limit: 5,
    });

    expect(template).toBe(
      query`
        MATCH (v)-[e]-(tgt) 
        WHERE ID(v) = "12" 
        WITH DISTINCT v, tgt 
        ORDER BY toInteger(ID(tgt)) 
        SKIP 5 
        LIMIT 5
        MATCH (v)-[e]-(tgt)
        RETURN 
          collect(DISTINCT tgt) AS vObjects, 
          collect({ edge: e, sourceTypes: labels(startNode(e)), targetTypes: labels(endNode(e)) }) AS eObjects 
      `
    );
  });

  it("Should return a template for specific vertex type", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["country"],
      offset: 5,
      limit: 10,
    });

    expect(template).toBe(
      query`
        MATCH (v)-[e]-(tgt:country) 
        WHERE ID(v) = "12" 
        WITH DISTINCT v, tgt 
        ORDER BY toInteger(ID(tgt)) 
        SKIP 5 
        LIMIT 10
        MATCH (v)-[e]-(tgt)
        RETURN 
          collect(DISTINCT tgt) AS vObjects, 
          collect({ edge: e, sourceTypes: labels(startNode(e)), targetTypes: labels(endNode(e)) }) AS eObjects 
      `
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
          collect({ edge: e, sourceTypes: labels(startNode(e)), targetTypes: labels(endNode(e)) }) AS eObjects
      `
    );
  });

  it("Should return a template for specific edge type", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      edgeTypes: ["locatedIn"],
      offset: 5,
      limit: 10,
    });

    expect(template).toBe(
      query`
        MATCH (v)-[e:locatedIn]-(tgt) 
        WHERE ID(v) = "12" 
        WITH DISTINCT v, tgt 
        ORDER BY toInteger(ID(tgt)) 
        SKIP 5 
        LIMIT 10
        MATCH (v)-[e:locatedIn]-(tgt)
        RETURN 
          collect(DISTINCT tgt) AS vObjects, 
          collect({ edge: e, sourceTypes: labels(startNode(e)), targetTypes: labels(endNode(e)) }) AS eObjects 
      `
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

    expect(template).toBe(
      query`
        MATCH (v)-[e]-(tgt:country) 
        WHERE ID(v) = "12" AND tgt.longest >= 10000 AND tgt.country CONTAINS "ES" 
        WITH DISTINCT v, tgt 
        ORDER BY toInteger(ID(tgt)) 
        SKIP 5 
        LIMIT 10
        MATCH (v)-[e]-(tgt)
        RETURN 
          collect(DISTINCT tgt) AS vObjects, 
          collect({ edge: e, sourceTypes: labels(startNode(e)), targetTypes: labels(endNode(e)) }) AS eObjects 
      `
    );
  });

  it("should return template for the example documentation", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("124"),
      filterByVertexTypes: ["airport"],
      edgeTypes: ["route"],
      limit: 10,
      offset: 10,
    });

    expect(template).toBe(
      query`
        MATCH (v)-[e:route]-(tgt:airport) 
        WHERE ID(v) = "124"
        WITH DISTINCT v, tgt 
        ORDER BY toInteger(ID(tgt)) 
        SKIP 10
        LIMIT 10
        MATCH (v)-[e:route]-(tgt)
        RETURN 
          collect(DISTINCT tgt) AS vObjects, 
          collect({ edge: e, sourceTypes: labels(startNode(e)), targetTypes: labels(endNode(e)) }) AS eObjects 
      `
    );
  });
});
