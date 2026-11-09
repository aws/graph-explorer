import { describe, expect, it } from "vitest";

import type { AttributeFilter } from "@/connector/useGEFetchTypes";

import { createVertexId } from "@/core";
import { query } from "@/utils";

import { UnrepresentableNumberError } from "../../queryValueError";
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

  // The limit is emitted only as a plain decimal, whatever its runtime type.
  it.each(["0x10", "1e3", " 5 ", "10 extra", "007"])(
    "Should refuse the limit %o, which has no plain-decimal form",
    limit => {
      expect(() =>
        oneHopTemplate({
          vertexId: createVertexId("12"),
          limit: limit as unknown as number,
        }),
      ).toThrow(new UnrepresentableNumberError(limit as unknown as number));
    },
  );

  it("Should refuse an infinite limit rather than drop the clause", () => {
    expect(() =>
      oneHopTemplate({
        vertexId: createVertexId("12"),
        limit: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(new UnrepresentableNumberError(Number.POSITIVE_INFINITY));
  });

  // The database, not the template, reports a number its position refuses.
  it.each([
    [-5, "-5"],
    [1.5, "1.5"],
  ])("Should emit the limit %s as given", (limit, text) => {
    expect(oneHopTemplate({ vertexId: createVertexId("12"), limit })).toContain(
      `LIMIT ${text}`,
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

  // filterByVertexTypes carries VertexType ids that were already split apart at
  // ingestion, so a value bearing :: must be used verbatim, not re-split.
  it("uses each vertex type verbatim without splitting on '::'", () => {
    const template = oneHopTemplate({
      vertexId: createVertexId("12"),
      filterByVertexTypes: ["country::capital", "city::town"],
    });

    expect(template).toContain("(v:`country::capital` OR v:`city::town`)");
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
