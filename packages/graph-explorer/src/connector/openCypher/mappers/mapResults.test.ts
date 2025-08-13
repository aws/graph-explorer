import { createResultScalar } from "@/core";
import { mapResults } from "./mapResults";
import {
  createTestableEdge,
  createTestableVertex,
  mapToOcEdge,
  mapToOcVertex,
} from "@/utils/testing";
import { createRandomInteger } from "@shared/utils/testing";

describe("mapResults", () => {
  it("should map empty results", () => {
    const result = mapResults({
      results: [],
    });

    expect(result).toEqual([]);
  });

  it("should map vertex value", () => {
    const vertex = createTestableVertex().asResult("n");
    const result = mapResults({
      results: [
        {
          n: mapToOcVertex(vertex),
        },
      ],
    });

    expect(result).toEqual([vertex]);
  });

  it("should map edge value", () => {
    const edge = createTestableEdge().asResult("n");

    const result = mapResults({
      results: [
        {
          n: mapToOcEdge(edge),
        },
      ],
    });

    expect(result).toEqual([edge]);
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

    expect(result).toEqual([
      createResultScalar({ value: expectedValue, name: "total" }),
      createResultScalar({ value: "total", name: "name" }),
      createResultScalar({ value: expectedValue, name: "list" }),
      createResultScalar({ value: null, name: "nullValue" }),
    ]);
  });

  it("should map vertex in array", () => {
    const vertex = createTestableVertex().asResult("n");
    const result = mapResults({
      results: [
        {
          n: [mapToOcVertex(vertex)],
        },
      ],
    });

    expect(result).toEqual([vertex]);
  });

  it("should map edge in array", () => {
    const edge = createTestableEdge().asResult("n");

    const result = mapResults({
      results: [
        {
          n: [mapToOcEdge(edge)],
        },
      ],
    });

    expect(result).toEqual([edge]);
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

    expect(result).toEqual([
      createResultScalar({ value: expectedValue, name: "n" }),
    ]);
  });

  it("should map nested objects", () => {
    const vertex = createTestableVertex().asResult("v");
    const edge = createTestableEdge().asResult("e");

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

    expect(result).toEqual([vertex, edge]);
  });

  it("should map deeply nested objects", () => {
    const vertex = createTestableVertex().asResult("v");
    const edge = createTestableEdge().asResult("e");

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

    expect(result).toEqual([vertex, edge]);
  });

  it("should map nested objects within array", () => {
    const vertex = createTestableVertex().asResult("v");
    const edge = createTestableEdge().asResult("e");

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

    expect(result).toEqual([vertex, edge]);
  });

  it("should map deeply nested objects within array", () => {
    const vertex = createTestableVertex().asResult("v");
    const edge = createTestableEdge().asResult("e");

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

    expect(result).toEqual([vertex, edge]);
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

    expect(result).toEqual([
      createResultScalar({ value: expectedValue, name: "collect" }),
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

    expect(result).toEqual([
      createResultScalar({ value: expectedValue, name: "values" }),
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

    expect(result).toEqual([
      createResultScalar({ value: 42, name: "count" }),
      createResultScalar({ value: "hello", name: "message" }),
      createResultScalar({ value: true, name: "isActive" }),
      createResultScalar({ value: null, name: "data" }),
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

    expect(result).toEqual([
      createResultScalar({ value: "John", name: "name" }),
      createResultScalar({ value: 30, name: "age" }),
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

    expect(result).toEqual([
      createResultScalar({ value: 1, name: "numbers" }),
      createResultScalar({ value: 2, name: "numbers" }),
      createResultScalar({ value: 3, name: "numbers" }),
      createResultScalar({ value: "a", name: "strings" }),
      createResultScalar({ value: "b", name: "strings" }),
    ]);
  });
});
