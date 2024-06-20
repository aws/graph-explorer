import normalize from "../../../utils/testing/normalize";
import oneHopTemplate from "./oneHopTemplate";

describe("OpenCypher > oneHopTemplate", () => {
  it("Should return a template for a simple vertex id", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      idType: "string",
    });

    expect(normalize(template)).toEqual(
      normalize(`
        MATCH (v)-[e]-(tgt)
        WHERE ID(v) = "12"
        WITH
          collect(DISTINCT tgt) AS vObjects,
          collect({ edge: e, sourceType: labels(startNode(e)), targetType: labels(endNode(e)) }) AS eObjects
        RETURN vObjects, eObjects
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
        MATCH (v)-[e]-(tgt) 
        WHERE ID(v) = "12" 
        WITH 
          collect(DISTINCT tgt)[..5] AS vObjects, 
          collect({ edge: e, sourceType: labels(startNode(e)), targetType: labels(endNode(e)) })[..5] AS eObjects 
        RETURN vObjects, eObjects
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
        MATCH (v)-[e]-(tgt:country) 
        WHERE ID(v) = "12" 
        WITH 
          collect(DISTINCT tgt)[..10] AS vObjects, 
          collect({ edge: e, sourceType: labels(startNode(e)), targetType: labels(endNode(e)) })[..10] AS eObjects 
        RETURN vObjects, eObjects
      `)
    );
  });

  it("Should return a template for many vertex types", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      idType: "string",
      filterByVertexTypes: ["country", "continent", "airport", "person"],
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v)-[e]-(tgt)
        WHERE ID(v) = "12" AND (v:country OR v:continent OR v:airport OR v:person)
        WITH
          collect(DISTINCT tgt) AS vObjects,
          collect({ edge: e, sourceType: labels(startNode(e)), targetType: labels(endNode(e)) }) AS eObjects
        RETURN vObjects, eObjects
      `)
    );
  });

  it("Should return a template for specific edge type", () => {
    const template = oneHopTemplate({
      vertexId: "12",
      idType: "string",
      edgeTypes: ["locatedIn"],
      offset: 5,
      limit: 10,
    });

    expect(normalize(template)).toBe(
      normalize(`
        MATCH (v)-[e:locatedIn]-(tgt) 
        WHERE ID(v) = "12" 
        WITH 
          collect(DISTINCT tgt)[..10] AS vObjects, 
          collect({ edge: e, sourceType: labels(startNode(e)), targetType: labels(endNode(e)) })[..10] AS eObjects 
        RETURN vObjects, eObjects
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
        MATCH (v)-[e]-(tgt:country) 
        WHERE ID(v) = "12" AND tgt.longest >= 10000 AND tgt.country CONTAINS "ES" 
        WITH 
          collect(DISTINCT tgt)[..10] AS vObjects, 
          collect({ edge: e, sourceType: labels(startNode(e)), targetType: labels(endNode(e)) })[..10] AS eObjects 
        RETURN vObjects, eObjects
      `)
    );
  });
});
