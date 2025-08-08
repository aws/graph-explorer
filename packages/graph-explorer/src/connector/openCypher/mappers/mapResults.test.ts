import { createScalar, createVertex, Edge } from "@/core";
import { mapResults } from "./mapResults";
import {
  createRandomEdge,
  createRandomVertex,
  mapToOcEdge,
  mapToOcVertex,
} from "@/utils/testing";
import { createRandomInteger } from "@shared/utils/testing";

describe("mapResults", () => {
  it("should map empty results", () => {
    const result = mapResults({
      results: [],
    });

    expect(result).toStrictEqual([]);
  });

  it("should map vertex value", () => {
    const vertex = createRandomVertex();
    const result = mapResults({
      results: [
        {
          n: mapToOcVertex(vertex),
        },
      ],
    });

    expect(result).toStrictEqual([vertex]);
  });

  it("should map edge value", () => {
    const edge = createRandomEdge();

    const result = mapResults({
      results: [
        {
          n: mapToOcEdge(edge),
        },
      ],
    });

    expect(result).toStrictEqual([toExpectedEdge(edge)]);
  });

  it("should map scalar value with names", () => {
    const expectedValue = createRandomInteger();

    const result = mapResults({
      results: [
        {
          total: expectedValue,
          name: "total",
          list: [expectedValue],
          nullValue: null,
        },
      ],
    });

    expect(result).toStrictEqual([
      createScalar({ value: expectedValue, name: "total" }),
      createScalar({ value: "total", name: "name" }),
      createScalar({ value: expectedValue, name: "list" }),
      createScalar({ value: null, name: "nullValue" }),
    ]);
  });

  it("should map vertex in array", () => {
    const vertex = createRandomVertex();
    const result = mapResults({
      results: [
        {
          n: [mapToOcVertex(vertex)],
        },
      ],
    });

    expect(result).toStrictEqual([vertex]);
  });

  it("should map edge in array", () => {
    const edge = createRandomEdge();

    const result = mapResults({
      results: [
        {
          n: [mapToOcEdge(edge)],
        },
      ],
    });

    expect(result).toStrictEqual([toExpectedEdge(edge)]);
  });

  it("should map scalar in array", () => {
    const expectedValue = createRandomInteger();

    const result = mapResults({
      results: [
        {
          n: [expectedValue],
        },
      ],
    });

    expect(result).toStrictEqual([
      createScalar({ value: expectedValue, name: "n" }),
    ]);
  });

  it("should map nested objects", () => {
    const vertex = createRandomVertex();
    const edge = createRandomEdge();

    const result = mapResults({
      results: [
        {
          n: {
            v: mapToOcVertex(vertex),
            e: mapToOcEdge(edge),
          },
        },
      ],
    });

    expect(result).toStrictEqual([vertex, toExpectedEdge(edge)]);
  });

  it("should map deeply nested objects", () => {
    const vertex = createRandomVertex();
    const edge = createRandomEdge();

    const result = mapResults({
      results: [
        {
          n: {
            deep: {
              v: mapToOcVertex(vertex),
              e: mapToOcEdge(edge),
            },
          },
        },
      ],
    });

    expect(result).toStrictEqual([vertex, toExpectedEdge(edge)]);
  });

  it("should map nested objects within array", () => {
    const vertex = createRandomVertex();
    const edge = createRandomEdge();

    const result = mapResults({
      results: [
        {
          n: [
            {
              v: mapToOcVertex(vertex),
              e: mapToOcEdge(edge),
            },
          ],
        },
      ],
    });

    expect(result).toStrictEqual([vertex, toExpectedEdge(edge)]);
  });

  it("should map deeply nested objects within array", () => {
    const vertex = createRandomVertex();
    const edge = createRandomEdge();

    const result = mapResults({
      results: [
        {
          n: [
            {
              deep: {
                v: mapToOcVertex(vertex),
                e: mapToOcEdge(edge),
              },
            },
          ],
        },
      ],
    });

    expect(result).toStrictEqual([vertex, toExpectedEdge(edge)]);
  });

  it("should map collect with array of scalars", () => {
    const expectedValue = createRandomInteger();

    const result = mapResults({
      results: [
        {
          collect: [expectedValue],
        },
      ],
    });

    expect(result).toStrictEqual([
      createScalar({ value: expectedValue, name: "collect" }),
    ]);
  });

  it("should map collect with array of records", () => {
    const expectedValue = createRandomInteger();

    const result = mapResults({
      results: [
        {
          collect: [{ values: expectedValue }],
        },
      ],
    });

    expect(result).toStrictEqual([
      createScalar({ value: expectedValue, name: "values" }),
    ]);
  });

  it("should preserve scalar names from top-level keys", () => {
    const result = mapResults({
      results: [
        {
          count: 42,
          message: "hello",
          isActive: true,
          data: null,
        },
      ],
    });

    expect(result).toStrictEqual([
      createScalar({ value: 42, name: "count" }),
      createScalar({ value: "hello", name: "message" }),
      createScalar({ value: true, name: "isActive" }),
      createScalar({ value: null, name: "data" }),
    ]);
  });

  it("should preserve names for scalars in nested objects", () => {
    const result = mapResults({
      results: [
        {
          user: {
            name: "John",
            age: 30,
          },
        },
      ],
    });

    expect(result).toStrictEqual([
      createScalar({ value: "John", name: "name" }),
      createScalar({ value: 30, name: "age" }),
    ]);
  });

  it("should preserve names for scalars in arrays", () => {
    const result = mapResults({
      results: [
        {
          numbers: [1, 2, 3],
          strings: ["a", "b"],
        },
      ],
    });

    expect(result).toStrictEqual([
      createScalar({ value: 1, name: "numbers" }),
      createScalar({ value: 2, name: "numbers" }),
      createScalar({ value: 3, name: "numbers" }),
      createScalar({ value: "a", name: "strings" }),
      createScalar({ value: "b", name: "strings" }),
    ]);
  });
});

/**
 * Reduces the source and target vertices to fragments with just the ID.
 */
function toExpectedEdge(edge: Edge): Edge {
  return {
    ...edge,
    source: createVertex({
      id: edge.source.id,
      types: [],
    }),
    target: createVertex({
      id: edge.target.id,
      types: [],
    }),
  };
}
